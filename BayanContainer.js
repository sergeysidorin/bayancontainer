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
	_staticHeight: [ ],
	_width: 0,


	constructor: function() {
	},


	_getSize: function(newWidget, action) {
		// get cumulative height of all the (selected and unselected) title bars
		var totalButtonHeight = 0;
		var mySize = this._contentBox;
		
		var result = [];
		
		array.forEach(this.getChildren(), function(child, childIndex, array){
			var wrapperDomNode = child._wrapperWidget.domNode,
				wrapperDomNodeMargin = domGeometry.getMarginExtents(wrapperDomNode),
				wrapperDomNodePadBorder = domGeometry.getPadBorderExtents(wrapperDomNode),
				wrapperContainerNode = child._wrapperWidget.containerNode,
				wrapperContainerNodeMargin = domGeometry.getMarginExtents(wrapperContainerNode),
				wrapperContainerNodePadBorder = domGeometry.getPadBorderExtents(wrapperContainerNode);
			if ( child == newWidget ) {
				if ( action == "open" ) {
					// newWidget is still not selected, but space for border is used
					result.push(0);
					totalButtonHeight +=  wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + wrapperContainerNodeMargin.h + wrapperContainerNodePadBorder.h + child._buttonWidget.getTitleHeight();
				}
				else if ( action == "full" ) {
					if ( child.staticHeight && !this._staticHeight[childIndex] ) {
						this._showChild(newWidget);
						this._staticHeight[childIndex] = child._wrapperWidget.containerNode.clientHeight;
					
					}
					result.push( child.staticHeight ? this._staticHeight[childIndex] : 'dyn' );
					if ( child.staticHeight )
						totalButtonHeight += this._staticHeight[childIndex];
					totalButtonHeight += wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + wrapperContainerNodeMargin.h + wrapperContainerNodePadBorder.h + child._buttonWidget.getTitleHeight();
					if ( this._width == 0 )
						this._width = mySize.w - wrapperDomNodeMargin.w - wrapperDomNodePadBorder.w - wrapperContainerNodeMargin.w - wrapperContainerNodePadBorder.w;
				}
				else if ( action == "close" ) {
					result.push(0);
					totalButtonHeight +=  wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + child._buttonWidget.getTitleHeight();
				}
			}
			else if ( child.selected ) {
				result.push( child.staticHeight?child.domNode.clientHeight:'dyn' );
				totalButtonHeight += child.staticHeight? domGeometry.getMarginBox(child._wrapperWidget.domNode).h
					: (wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + wrapperContainerNodeMargin.h + wrapperContainerNodePadBorder.h + child._buttonWidget.getTitleHeight());
				if ( this._width == 0 )
					this._width = mySize.w - wrapperDomNodeMargin.w - wrapperDomNodePadBorder.w - wrapperContainerNodeMargin.w - wrapperContainerNodePadBorder.w;
			}
			else {
				result.push(0);
				totalButtonHeight +=  wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + child._buttonWidget.getTitleHeight();
			}
		}, this);
		
		var verticalSpace = mySize.h - totalButtonHeight;
		
		var numOpen = array.filter(result, function(item) { return item=='dyn'; }).length;

		for (var i=0; i<result.length; i ++ ){
			if ( result[i] == 'dyn' ) {
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
			this._transition(newWidget, "show", animate);
		}
		else {
			var dynamicCount = array.filter(this.getChildren(), function(child) { return child.selected && !child.staticHeight; }).length;
			if ( dynamicCount > 1 || newWidget.staticHeight == true ) {
				this._transition(newWidget, "hide", animate);
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

//animate = false;
//this.duration = 2000;
		if ( animate ) {
			// USE ANIMATION
			// First of all, stop all active animations.
			if ( this._animation ) {
				this._animation.stop(true);
				delete this._animation;
			}

			var self = this;
			var children = this.getChildren();

			if ( action == "show" ) {
				this._childrenOldHeight = this._getSize(newWidget, "open");	// pane has height=0, but border already displayed
				this._childrenHeight = this._getSize(newWidget, "full");	// pane is displayed, both content and border
			}
			else {
				// action=="hide"
				this._childrenOldHeight = this._getSize(newWidget, "full");
				this._childrenHeight = this._getSize(newWidget, "close");	// pane has height=0 and border not displayed
			}
			
			if ( action == "show" ) {
				newWidget._wrapperWidget.set("selected", true);
				var d = this._showChild(newWidget);
				newWidget._wrapperWidget.containerNode.style.height = "0px";
			}
			
			var _verticalSpace = 0;
			var _lastPane = 0;
			array.forEach(children, function(child, childIndex) {
//				if ( child==newWidget && action=="show" && child.staticHeight ) {
//					if ( !this._staticHeight[childIndex] )
//						this._staticHeight[childIndex] = this._childrenHeight[childIndex];
//				}
				_verticalSpace += this._childrenOldHeight[childIndex];
				if ( this._childrenHeight[childIndex] > 0 || child == newWidget ) {
					_lastPane = child;
					if ( this._childrenHeight[childIndex] > this._childrenOldHeight[childIndex] )
						child.containerNode.style.height = this._childrenHeight[childIndex]+"px";
				}
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
//							if ( child.staticHeight != true ) {
								child._wrapperWidget.containerNode.style.height = h + "px";
//							}
						}
					}, self);
				},
				onEnd: function() {
					delete self._animation;
					if ( action == "hide" ) {
						self._hideChild(newWidget);
						newWidget._wrapperWidget.set("selected", false);
						if ( newWidget.staticHeight ) {
							newWidget.containerNode.style.height = this._childrenHeight[childIndex]+"px";
						}
					}
					array.forEach(children, function(child, childIndex) {
						var h = this._childrenHeight[childIndex];
//						if ( child.staticHeight != true )
							child.resize( { w: this._width, h: h } );
					}, self);
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
//				if ( child.staticHeight != true ) {
					var h = this._childrenHeight[childIndex];
					if ( h )
						child.resize( { w: this._width, h: h } );
//				}
//				else {
//					console.log("staticHeight pane detected, height = "+domGeometry.getMarginSize(child._wrapperWidget.containerNode).h);
//				}
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
					child.selected = true, dynamicCount++;//, child._wrapperWidget.set("selected", true);
			}, this);
		}
		r = this.inherited(arguments);
		return r;
	    }


	});
    }
);
