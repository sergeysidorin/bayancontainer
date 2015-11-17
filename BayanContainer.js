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
//	    staticHeight: false,

	    baseClass: "dijitAccordionContainer",
	    
	    _childrenHeight: [ ],
	    _childrenOldHeight: [ ],
//	    _childrenSelected: [ ],
	    _childrenSelectedDynamicCount: 0,
	    
	    constructor: function() {
		console.log("BayanContainer costructor running");
		this._width = 0;
		_childrenSelectedDynamicCount = 0;
	    },
	    
	    
	    _getSize: function(newWidget, action) {
		// get cumulative height of all the (selected and unselected) title bars
		var totalButtonHeight = 0;
//		var selectedChildrenId = array.map(this._childrenSelected, function(item){ return item.id; });
//console.log("this._childrenSelected="+this._childrenSelected);
//console.log("selectedchildrenid="+selectedChildrenId);
		var mySize = this._contentBox;
		
		var result = [];
		var num_dynamic = 0;
		
		array.forEach(this.getChildren(), function(child, index, array){
console.log("Child is selected? "+child.selected);
//			var i = dojo.indexOf(selectedChildrenId, child.id);
//			var i = dojo.indexOf(this.childrenSelected, child);
			console.log("_getSize: index = "+i+", child="+child);
			var wrapperDomNode = child._wrapperWidget.domNode,
				wrapperDomNodeMargin = domGeometry.getMarginExtents(wrapperDomNode),
				wrapperDomNodePadBorder = domGeometry.getPadBorderExtents(wrapperDomNode),
				wrapperContainerNode = child._wrapperWidget.containerNode,
				wrapperContainerNodeMargin = domGeometry.getMarginExtents(wrapperContainerNode),
				wrapperContainerNodePadBorder = domGeometry.getPadBorderExtents(wrapperContainerNode);
			result.push( (child.selected != true || ( action=="show" && child==newWidget ))?0:(child.staticHeight?-1:1) );
			if ( child.selected != true && !(action == "show" && child==newWidget) ){
				totalButtonHeight +=  wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + child._buttonWidget.getTitleHeight();
			}
			else {
				if ( child.staticHeight ) {
					totalButtonHeight += domGeometry.getMarginBox(child._wrapperWidget.domNode).h;
				}
				else {
					totalButtonHeight +=  wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + wrapperContainerNodeMargin.h + wrapperContainerNodePadBorder.h + child._buttonWidget.getTitleHeight();
					num_dynamic ++;
				}
				if ( this._width == 0 )
					this._width = mySize.w - wrapperDomNodeMargin.w - wrapperDomNodePadBorder.w - wrapperContainerNodeMargin.w - wrapperContainerNodePadBorder.w;
			}
		}, this);
		
		var verticalSpace = mySize.h - totalButtonHeight;
		
		var numOpen = num_dynamic;
console.log("NumOpen="+numOpen);
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
//		console.log("adding child, index="+insertIndex);
//		console.log("adding child "+child+" with staticHeight="+child.staticHeight);
		if ( child.staticHeight ) {
//			if ( this._childrenSelected.length == 0 ) {
			if ( this.getChildren().length == 0 ) {
//				this._childrenSelected.push(child);
				console.log("push "+child);
			}
		}
		else {
			if ( this._childrenSelectedDynamicCount == 0 ) {
//				this._childrenSelected.push(child);
				this._childrenSelectedDynamicCount ++;
				console.log("push "+child);
			}
		}
		var r = this.inherited(arguments);
		return r;
	    },
	
	    
	    selectChild: function(newWidget, animate) {
		var childIndex = dojo.indexOf(this.getChildren(), newWidget);
//		var selectedIndex = dojo.indexOf(this._childrenSelected, newWidget);
		var action = "";
//		if ( selectedIndex == -1 ) {
		if ( newWidget.selected != true ) {
//		    this._childrenSelected.push(newWidget);
		    if ( newWidget.staticHeight != true )
			this._childrenSelectedDynamicCount ++;
		    topic.publish(this.id + "-selectChild", newWidget);	// publish
		    action = "show";
		    this._transition(newWidget, action, animate);
		}
		else {
		    if ( this._childrenSelectedDynamicCount > 1 || newWidget.staticHeight == true ) {
//			this._childrenSelected.splice(selectedIndex, 1);
			if ( newWidget.staticHeight != true )
				this._childrenSelectedDynamicCount --;
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

animate = false;

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
							if ( child.staticHeight != true )
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
			if ( action == "hide" ) {
				newWidget._wrapperWidget.set("selected", false);
				this._hideChild(newWidget);
			}
			if ( action == "show" ) {
				newWidget._wrapperWidget.set("selected", true);
				var d = this._showChild(newWidget);
			}

			this._childrenHeight = this._getSize();

			// Resize all children
			array.forEach(this.getChildren(), function(child, childIndex) {
				if ( child.staticHeight != true ) {
					var h = this._childrenHeight[childIndex];
					if ( h )
						child.resize( { w: this._width, h: h } );
				}
				else {
					console.log("staticHeight pane detected, height = "+domGeometry.getMarginSize(child._wrapperWidget.containerNode).h);
				}
			}, this);
			
			this._childrenOldHeight = this._childrenHeight;
		}
		return d;	// If child has an href, promise that fires when the widget has finished loading

	    },

	});
    }
);
