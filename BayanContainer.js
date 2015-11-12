
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
    ],
    function(declare, has, array, AccordionContainer, ContentPane, domReady, _WidgetBase, domGeometry, json, topic) {
	declare("BayanContainer", AccordionContainer, {
	    baseClass: "dijitBayanContainer",
	    
	    selectedChildren: [ ],
	    
	    childHeight: [ ],
	    
	    childAnimation: [ ],
	    
	    constructor: function() {
		console.log("BayanContainer costructor running");
		this._width = 0;
	    },
	    
	    
	    _remakeSize: function() {
		// get cumulative height of all the unselected title bars
		var totalCollapsedHeight = 0;
		var totalOpenButtonHeight = 0;
		var selectedChildrenId = array.map(this.selectedChildren, function(item){ return item.id; });
		console.log("layout: selectedChildrenId="+selectedChildrenId);
		var mySize = this._contentBox;
		
		this.childHeight = new Array();
		array.forEach(this.getChildren(), function(child, index, array){
			var i = dojo.indexOf(selectedChildrenId, child.id);
			console.log("index for "+child.id+" is "+i);
			if( i == -1 ){
				console.log("layout: collapsed child "+child);
				totalCollapsedHeight += domGeometry.getMarginSize(child._wrapperWidget.domNode).h;
				this.childHeight.push(0);
			}
			else {
				console.log("layout: open child "+child);
				var wrapperDomNode = child._wrapperWidget.domNode;
				var wrapperDomNodeMargin = domGeometry.getMarginExtents(wrapperDomNode);
				var wrapperDomNodePadBorder = domGeometry.getPadBorderExtents(wrapperDomNode);
				var wrapperContainerNode = child._wrapperWidget.containerNode;
				var wrapperContainerNodeMargin = domGeometry.getMarginExtents(wrapperContainerNode);
				var wrapperContainerNodePadBorder = domGeometry.getPadBorderExtents(wrapperContainerNode);

				totalOpenButtonHeight += wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + wrapperContainerNodeMargin.h + wrapperContainerNodePadBorder.h + child._buttonWidget.getTitleHeight();

				if ( this._width == 0 )
					this._width = mySize.w - wrapperDomNodeMargin.w - wrapperDomNodePadBorder.w - wrapperContainerNodeMargin.w - wrapperContainerNodePadBorder.w;
				
				this.childHeight.push(1);
			}
		}, this);

		var verticalSpace = mySize.h - totalCollapsedHeight - totalOpenButtonHeight;

		// Memo size to make displayed child
		var numOpen = this.selectedChildren.length;
		
		for(var i = 0; i < this.childHeight.length; i ++ )
			if ( this.childHeight[i] == 1 ) {
				this.childHeight[i] = Math.floor(verticalSpace / numOpen + 0.5);
				verticalSpace -= this.childHeight[i];
				numOpen --;
			}
	    },
	    
	    
	    _resize: function() {
		this._remakeSize();
		array.forEach(this.getChildren(), function(child, childIndex) {
			if ( this.childHeight[childIndex] > 0 )
				child.resize( { w: this._width, h: this.childHeight[childIndex] } );
		}, this);
	    },
	    
	    
	    layout: function() {
		this._resize();
	    },
	    
	    addChild: function(child, insertIndex) {
		console.log("addChild:"+child+":"+insertIndex);
		if(!this.selectedChildren.length){
		    console.log("addChild: calling selectChild:"+child);
		    this.selectedChildren = [ child ];
		}
		return this.inherited(arguments);
	    },
	    
	    selectChild: function(newWidget, animate) {
		var index = dojo.indexOf(this.selectedChildren, newWidget);
		if ( index == -1 ) {
		    this.selectedChildren.push(newWidget);
		    topic.publish(this.id + "-selectChild", newWidget);	// publish
//		    this._transition(newWidget, 1, animate);
		    this._showChild(newWidget);
		    this._resize();
		}
		else {
		    if ( this.selectedChildren.length == 1 ) {
		    }
		    else {
			this.selectedChildren.splice(index, 1);
//			this._transition(newWidget, 0, animate);
			this._hideChild(newWidget);
			this._resize();
		    }
		}
	    },

	    _transition: function(newWidget, mode, animate){
		var sizes = this._getSize();

		console.log("_new transition!");
		if(has("ie") < 8){
		    animate = false;
		}

		Array.forEach(this.childAnimation, function(animation, index) {
		    if ( typeof animation == 'object' ) {
			animation.stop(true);
			delete this.childAnimation[index];
		    }
		}, this);

		var self = this;
		
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

		return d;	// If child has an href, promise that fires when the widget has finished loading

	    },

//	    _transition: function(/*dijit/_WidgetBase?*/ newWidget, /*dijit/_WidgetBase?*/ oldWidget, /*Boolean*/ animate){
/*
		console.log("_transition:"+newWidget+":"+oldWidget+":"+animate);
		return this.inherited(arguments);
		
		if(has("ie") < 8){
		    animate = false;
		}

		if(this._animation){
		    // there's an in-progress animation.  speedily end it so we can do the newly requested one
		    this._animation.stop(true);
		    delete this._animation;
		}

		var self = this;

		if(newWidget){
		    newWidget._wrapperWidget.set("selected", true);

		    var d = this._showChild(newWidget);	// prepare widget to be slid in

		    // Size the new widget, in case this is the first time it's being shown,
		    // or I have been resized since the last time it was shown.
		    // Note that page must be visible for resizing to work.
		    if(this.doLayout && newWidget.resize){
			newWidget.resize(this._containerContentBox);
		    }
		}

		if(oldWidget){
		    oldWidget._wrapperWidget.set("selected", false);
		    if(!animate){
			this._hideChild(oldWidget);
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

		return d;	// If child has an href, promise that fires when the widget has finished loading
	    },
*/
	    
	    
	    
	});
    }
);
