
require(
    [
	'dojo/_base/declare',
	'dojo/sniff', // has("ie") has("dijit-legacy-requires")
	'dojo/_base/array',
	'dijit/layout/AccordionContainer',
	'dijit/layout/ContentPane',
	'dojo/domReady!',
	'dijit/_WidgetBase',
	'dojo/dom-geometry',
	'dojo/_base/json',
	"dojo/topic", // publish
	"dojo/dom-attr",
	"dojo/dom-style",
	"dojo/_base/fx", // fx.Animation
    ],
    function(declare, has, array, AccordionContainer, ContentPane, domReady, _WidgetBase, domGeometry, json, topic, domAttr, domStyle, fx) {
	declare("BayanContainer", AccordionContainer, {
	    baseClass: "dijitAccordionContainer",
	    
	    childrenHeight: [ ],
	    childrenOldHeight: [ ],
	    
	    selectedChildren: [ ],
	    
	    childrenAnimation: [ ],
	    
	    constructor: function() {
		console.log("BayanContainer costructor running");
		this._width = 0;
	    },
	    
	    
	    _getSize: function(newWidget, action) {
		// get cumulative height of all the (selected and unselected) title bars
		var totalButtonHeight = 0;
		var selectedChildrenId = array.map(this.selectedChildren, function(item){ return item.id; });
		var mySize = this._contentBox;
		
		var result = [];
		
		array.forEach(this.getChildren(), function(child, index, array){
			var i = dojo.indexOf(selectedChildrenId, child.id);
			var wrapperDomNode = child._wrapperWidget.domNode,
				wrapperDomNodeMargin = domGeometry.getMarginExtents(wrapperDomNode),
				wrapperDomNodePadBorder = domGeometry.getPadBorderExtents(wrapperDomNode),
				wrapperContainerNode = child._wrapperWidget.containerNode,
				wrapperContainerNodeMargin = domGeometry.getMarginExtents(wrapperContainerNode),
				wrapperContainerNodePadBorder = domGeometry.getPadBorderExtents(wrapperContainerNode);
			result.push( (i == -1 || ( action=="show" && child==newWidget ))?0:1 );
			if ( i == -1 && !(action == "show" && child==newWidget) ){
				totalButtonHeight +=  wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + child._buttonWidget.getTitleHeight();
			}
			else {
				totalButtonHeight +=  wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + wrapperContainerNodeMargin.h + wrapperContainerNodePadBorder.h + child._buttonWidget.getTitleHeight();
				if ( this._width == 0 )
					this._width = mySize.w - wrapperDomNodeMargin.w - wrapperDomNodePadBorder.w - wrapperContainerNodeMargin.w - wrapperContainerNodePadBorder.w;
			}
		}, this);

		var verticalSpace = mySize.h - totalButtonHeight;

		var numOpen = this.selectedChildren.length ;
		if ( action == "show" )
			numOpen --;
		for (var i=0; i<result.length; i ++ ){
			if ( result[i] == 1 ) {
				var h = Math.floor(verticalSpace / numOpen + 0.5);
				result[i] = h;
				verticalSpace -= h;
				numOpen --;
			}
		}
		return result;
	    },
	    
	    
	    layout: function() {
		this._transition(this.getChildren()[0], "show", false);
	    },
	
	    
	    addChild: function(child, insertIndex) {
		if(!this.selectedChildren.length){
		    this.selectedChildren = [ child ];
		}
		return this.inherited(arguments);
	    },
	
	    
	    selectChild: function(newWidget, animate) {
		var childIndex = dojo.indexOf(this.getChildren(), newWidget);
		var selectedIndex = dojo.indexOf(this.selectedChildren, newWidget);
		var action = "";
		if ( selectedIndex == -1 ) {
		    this.selectedChildren.push(newWidget);
		    topic.publish(this.id + "-selectChild", newWidget);	// publish
		    action = "show";
		    this._transition(newWidget, action, animate);
		}
		else {
		    if ( this.selectedChildren.length == 1 ) {
		    }
		    else {
			this.selectedChildren.splice(selectedIndex, 1);
			action = "hide";
			this._transition(newWidget, action, animate);
		    }
		}
	    },

	    _transition: function(newWidget, action, animate){
		if ( action == "" )
		    return;
		
		if(has("ie") < 8)
		    animate = false;

//animate = false;

		if ( animate ) {
			// USE ANIMATION
			// First of all, stop all active animations.
			if ( this._animation ) {
				this._animation.stop(true);
				delete this._animation;
			}
			if ( action == "show" )
				this.childrenOldHeight = this._getSize(newWidget, action);
			this.childrenHeight = this._getSize();
			
			var self = this;
			
			var children = this.getChildren();
			var childIndex = children.indexOf(newWidget);
			if ( action == "show" ) {
//			    this.childrenOldHeight[childIndex] = 0;
			    newWidget._wrapperWidget.containerNode.style.height = 0 + "px";
			    newWidget._wrapperWidget.set("selected", true);
			    this._showChild(newWidget);
			}
			
			var _verticalSpace = 0;
			var _lastPane = 0;
			Array.forEach(children, function(child, childIndex) {
				_verticalSpace += this.childrenOldHeight[childIndex];
				if ( this.childrenHeight[childIndex] > 0 || child == newWidget )
					_lastPane = child;
			}, this);
			
			this._animation = new fx.Animation({
				duration: this.duration,
				curve: [ 0, 1 ],
				onAnimate: function(value) {
					var usedHeight = 0;
					Array.forEach(children, function(child, childIndex) {
						if ( this.childrenHeight[childIndex] > 0 || child == newWidget ) {
							var h = (child == _lastPane && value < 1) ? (_verticalSpace - usedHeight) 
								: this.childrenOldHeight[childIndex] + Math.floor( (this.childrenHeight[childIndex] - this.childrenOldHeight[childIndex])*value + 0.5);
							usedHeight += h;
							child._wrapperWidget.containerNode.style.height = h + "px";
						}
					}, self);
				},
				onEnd: function() {
					delete self._animation;
					if ( action == "hide" ) {
						self._hideChild(newWidget);
						newWidget._wrapperWidget.set("selected", false);
					}
					self.childrenOldHeight = self.childrenHeight;
				}
			});
			this._animation.onStop = this._animation.onEnd;
			this._animation.play();
		
		}
		else {
			// NO ANIMATION
			this.childrenHeight = this._getSize();
			if ( action == "hide" ) {
				newWidget._wrapperWidget.set("selected", false);
				this._hideChild(newWidget);
			}
			if ( action == "show" ) {
				newWidget._wrapperWidget.set("selected", true);
				this._showChild(newWidget);
			}

			// Resize all children
			Array.forEach(this.getChildren(), function(child, childIndex) {
				var h = this.childrenHeight[childIndex];
				if ( h )
					child.resize( { w: this._width, h: h } );
			}, this);
			
			this.childrenOldHeight = this.childrenHeight;
		}
/*
		var self = this;
		
		var children = this.getChildren();

		Array.foreach(newSizes, function(height, index) {
			if ( height == 0 ) {
			}
		}, this);
		
		if ( mode == 1 ) {
		    newWidget._wrapperWidget.set("selected", true);

		    var d = this._showChild(newWidget);	// prepare widget to be slid in

		    // Size the new widget, in case this is the first time it's being shown,
		    // or I have been resized since the last time it was shown.
		    // Note that page must be visible for resizing to work.
		    if(this.doLayout && newWidget.resize){
			newWidget.resize(this._containerContentBox);
		    }
		    
		}
		if( mode == 0 ){
		    newWidget._wrapperWidget.set("selected", false);
		    if(!animate){
			this._hideChild(newWidget);
		    }
		}

		if(animate){
		    var newContents = newWidget._wrapperWidget.containerNode,
		    oldContents = oldWidget._wrapperWidget.containerNode;

		    // During the animation we will be showing two dijitAccordionChildWrapper nodes at once,
		    // which on claro takes up 4px extra space (compared to stable AccordionContainer).
		    // Have to compensate for that by immediately shrinking the pane being closed.
		    var wrapperContainerNode = newWidget._wrapperWidget.containerNode,
			wrapperContainerNodeMargin = domGeometry.getMarginExtents(wrapperContainerNode),
			wrapperContainerNodePadBorder = domGeometry.getPadBorderExtents(wrapperContainerNode),
			animationHeightOverhead = wrapperContainerNodeMargin.h + wrapperContainerNodePadBorder.h;

		    oldContents.style.height = (self._verticalSpace - animationHeightOverhead) + "px";

		    this._animation = new fx.Animation({
			node: newContents,
			duration: this.duration,
			curve: [1, this._verticalSpace - animationHeightOverhead - 1],
			onAnimate: function(value){
			    value = Math.floor(value);	// avoid fractional values
			    newContents.style.height = value + "px";
			    oldContents.style.height = (self._verticalSpace - animationHeightOverhead - value) + "px";
			},
			onEnd: function(){
			    delete self._animation;
			    newContents.style.height = "auto";
			    oldWidget._wrapperWidget.containerNode.style.display = "none";
			    oldContents.style.height = "auto";
			    self._hideChild(oldWidget);
			}
		    });
		    this._animation.onStop = this._animation.onEnd;
		    this._animation.play();
		}
*/
		return;
//		return d;	// If child has an href, promise that fires when the widget has finished loading

	    },

	});
    }
);
