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
	    
	    _childrenHeight: [ ],
	    _childrenOldHeight: [ ],
	    
	    constructor: function() {
		this._width = 0;
	    },
	    
	    
	    _getSize: function(newWidget, action) {
		// get cumulative height of all the (selected and unselected) title bars
		var totalButtonHeight = 0;
		var mySize = this._contentBox;
		
		var result = [];
		var num_dynamic = 0;
		
		array.forEach(this.getChildren(), function(child, index, array){
console.log("Child is selected? "+child.selected);
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
	    
	    
	    selectChild: function(newWidget, animate) {
		var action = "";
		if ( newWidget.selected != true ) {
		    topic.publish(this.id + "-selectChild", newWidget);	// publish
		    action = "show";
		    this._transition(newWidget, action, animate);
		}
		else {
		    var dynamicCount = array.filter(this.getChildren(), function(child) { return child.selected && !child.staticHeight; }).length;
		    if ( dynamicCount > 1 || newWidget.staticHeight == true ) {
			action = "hide";
			this._transition(newWidget, action, animate);
		    }
		}
	    },
	    
	    
		layout: function() {
			array.forEach(this.getChildren(), function(child) {
				if ( child.selected )
					this._transition(child, "show", false);
			}, this);
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
	    
	    
	    startup: function () {
		var dynamicCount = 0;
		array.forEach(this.getChildren(), function(child) {
			if ( !child.staticHeight && child.selected )
				dynamicCount ++;
//			if ( child.selected )
//				child._wrapperWidget.set("selected", true);

		});
		if ( dynamicCount == 0 ) {
			array.forEach(this.getChildren(), function(child) {
				if ( !child.staticHeight && !dynamicCount )
					child.selected = true, dynamicCount++, child._wrapperWidget.set("selected", true);
			}, this);
		}
		r = this.inherited(arguments);
		return r;
	    }


	});
    }
);
