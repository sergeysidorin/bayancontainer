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
	    staticHeight: false,

	    baseClass: "dijitAccordionContainer",
	    
	    _childrenHeight: [ ],
	    _childrenOldHeight: [ ],
	    _childrenSelected: [ ],
	    
	    constructor: function() {
		console.log("BayanContainer costructor running");
		this._width = 0;
	    },
	    
	    
	    _getSize: function(newWidget, action) {
		// get cumulative height of all the (selected and unselected) title bars
		var totalButtonHeight = 0;
		var selectedChildrenId = array.map(this._childrenSelected, function(item){ return item.id; });
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

		var numOpen = this._childrenSelected.length ;
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
		console.log("adding child "+child+" with staticHeight="+child.staticHeight);
		if(!this._childrenSelected.length){
		    this._childrenSelected = [ child ];
		}
		return this.inherited(arguments);
	    },
	
	    
	    selectChild: function(newWidget, animate) {
		var childIndex = dojo.indexOf(this.getChildren(), newWidget);
		var selectedIndex = dojo.indexOf(this._childrenSelected, newWidget);
		var action = "";
		if ( selectedIndex == -1 ) {
		    this._childrenSelected.push(newWidget);
		    topic.publish(this.id + "-selectChild", newWidget);	// publish
		    action = "show";
		    this._transition(newWidget, action, animate);
		}
		else {
		    if ( this._childrenSelected.length == 1 ) {
		    }
		    else {
			this._childrenSelected.splice(selectedIndex, 1);
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
				this._childrenOldHeight = this._getSize(newWidget, action);
			this._childrenHeight = this._getSize();
			
			var self = this;
			
			var children = this.getChildren();
			if ( action == "show" ) {
			    newWidget._wrapperWidget.set("selected", true);
			    var d = this._showChild(newWidget);
			}
			
			var _verticalSpace = 0;
			var _lastPane = 0;
			array.forEach(children, function(child, childIndex) {
				_verticalSpace += this._childrenOldHeight[childIndex];
				if ( this._childrenHeight[childIndex] > 0 || child == newWidget )
					_lastPane = child;
			}, this);
			
			this._animation = new fx.Animation({
				duration: this.duration,
				curve: [ 0, 1 ],
				onAnimate: function(value) {
					var usedHeight = 0;
					array.forEach(children, function(child, childIndex) {
						if ( this._childrenHeight[childIndex] > 0 || child == newWidget ) {
							var h = (child == _lastPane && value < 1) ? (_verticalSpace - usedHeight) 
								: this._childrenOldHeight[childIndex] + Math.floor( (this._childrenHeight[childIndex] - this._childrenOldHeight[childIndex])*value + 0.5);
							usedHeight += h;
							child.resize( { w: this._width, h: h } );
						}
					}, self);
				},
				onEnd: function() {
					delete self._animation;
					if ( action == "hide" ) {
						self._hideChild(newWidget);
						newWidget._wrapperWidget.set("selected", false);
					}
					self._childrenOldHeight = self._childrenHeight;
				}
			});
			this._animation.onStop = this._animation.onEnd;
			this._animation.play();
		
		}
		else {
			// NO ANIMATION
			this._childrenHeight = this._getSize();
			if ( action == "hide" ) {
				newWidget._wrapperWidget.set("selected", false);
				this._hideChild(newWidget);
			}
			if ( action == "show" ) {
				newWidget._wrapperWidget.set("selected", true);
				var d = this._showChild(newWidget);
			}

			// Resize all children
			array.forEach(this.getChildren(), function(child, childIndex) {
				var h = this._childrenHeight[childIndex];
				if ( h )
					child.resize( { w: this._width, h: h } );
			}, this);
			
			this._childrenOldHeight = this._childrenHeight;
		}
		return d;	// If child has an href, promise that fires when the widget has finished loading

	    },

	});
    }
);
