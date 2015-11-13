
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
    ],
    function(declare, has, array, AccordionContainer, ContentPane, domReady, _WidgetBase, domGeometry, json, topic, domAttr, domStyle) {
	declare("BayanContainer", AccordionContainer, {
	    baseClass: "dijitBayanContainer",
	    
	    childrenHeight: [ ],
	    
	    selectedChildren: [ ],
	    
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
		
		array.forEach(this.getChildren(), function(child, index, array){
			var i = dojo.indexOf(selectedChildrenId, child.id);
			console.log("index for "+child.id+" is "+i);
			if( i == -1 ){
				console.log("layout: collapsed child "+child);
				totalCollapsedHeight += domGeometry.getMarginSize(child._wrapperWidget.domNode).h;
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
			}
		}, this);

		var verticalSpace = mySize.h - totalCollapsedHeight - totalOpenButtonHeight;

		var numOpen = this.selectedChildren.length;
		array.forEach(this.getChildren(), function(child, childIndex, array){
			var i = dojo.indexOf(selectedChildrenId, child.id);
			if( i == -1 ){
//				domAttr.remove(child, "newHeight");
				domAttr.set(child, "newHeight", 0);
			}
			else {
				var h = Math.floor(verticalSpace / numOpen + 0.5);
			alert("Set newHeight = "+h+" for child #"+childIndex);
				domAttr.set(child, "newHeight", h);
				domStyle.set(child, "newHeight", h);
				verticalSpace -= h;
				numOpen --;


			var h = domAttr.get(child, "newHeight");
			var h = domStyle.get(child, "newHeight");
			alert("Check newHeight = "+h+" for child #"+childIndex);
			}
			
		}, this);
		
	    },
	    
	    
	    _getSize: function() {
		// get cumulative height of all the unselected title bars
		var totalCollapsedHeight = 0;
		var totalOpenButtonHeight = 0;
		var selectedChildrenId = array.map(this.selectedChildren, function(item){ return item.id; });
		var mySize = this._contentBox;
		
		var result = [];
		
		array.forEach(this.getChildren(), function(child, index, array){
			var i = dojo.indexOf(selectedChildrenId, child.id);
			console.log("getSize: index for "+child.id+" is "+i);
			if( i == -1 ){
				console.log("getSize: collapsed child "+child);
				totalCollapsedHeight += domGeometry.getMarginSize(child._wrapperWidget.domNode).h;
				result.push(0);
			}
			else {
				console.log("getSize: open child "+child);
				var wrapperDomNode = child._wrapperWidget.domNode;
				var wrapperDomNodeMargin = domGeometry.getMarginExtents(wrapperDomNode);
				var wrapperDomNodePadBorder = domGeometry.getPadBorderExtents(wrapperDomNode);
				var wrapperContainerNode = child._wrapperWidget.containerNode;
				var wrapperContainerNodeMargin = domGeometry.getMarginExtents(wrapperContainerNode);
				var wrapperContainerNodePadBorder = domGeometry.getPadBorderExtents(wrapperContainerNode);

				totalOpenButtonHeight += wrapperDomNodeMargin.h + wrapperDomNodePadBorder.h + wrapperContainerNodeMargin.h + wrapperContainerNodePadBorder.h + child._buttonWidget.getTitleHeight();

				result.push(1);
				
				if ( this._width == 0 )
					this._width = mySize.w - wrapperDomNodeMargin.w - wrapperDomNodePadBorder.w - wrapperContainerNodeMargin.w - wrapperContainerNodePadBorder.w;
			}
		}, this);

		var verticalSpace = mySize.h - totalCollapsedHeight - totalOpenButtonHeight;

		var numOpen = this.selectedChildren.length;
		console.log("getSize: total number of selected = "+numOpen+", verticalSpace="+verticalSpace+", tCH="+totalCollapsedHeight+", tOBH="+totalOpenButtonHeight);
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
	    
	    
	    _resize: function() {
		this._remakeSize();
		array.forEach(this.getChildren(), function(child, childIndex) {
			var h = domAttr.get(child, "newHeight");
			alert("Got newHeight = "+h+" for child #"+childIndex);
			if ( h )
				child.resize( { w: this._width, h: h } );
		}, this);
	    },
	    
	    
	    layout: function() {
		this._transition(this.getChildren()[0], "show", false);
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
		console.log("_new transition! "+newWidget+" / "+action);
		if ( action == "" )
		    return;
		
		if(has("ie") < 8)
		    animate = false;

animate = false;
		// Recalculate height for all children. Height for hidden child = 0, for visible child > 0.
		this.childrenHeight = this._getSize();


		if ( animate ) {
			// USE ANIMATION
			// First of all, stop all active animations.
			Array.forEach(this.childAnimation, function(animation, index) {
				if ( typeof animation == 'object' ) {
					animation.stop(true);
					delete this.childAnimation[index];
				}
			}, this);

			// Resize all children
			Array.forEach(this.getChildren(), function(child, childIndex) {
				var newContents = child._wrapperWidget.containerNode,
				    oldHeight = newContents.style.heigth;
				alert("Children #"+childIndex+", height="+oldHeight);
//				var h = this.childrenHeight[childIndex];
//				if ( h )
//					child.resize( { w: this._width, h: h } );
			}, this);

/*
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
*/






		}
		else {
			// NO ANIMATION
			if ( action == "hide" ) {
				console.log("no animate transition: hide child "+newWidget);
				newWidget._wrapperWidget.set("selected", false);
				this._hideChild(newWidget);
			}
			if ( action == "show" ) {
				console.log("no animate transition: show child "+newWidget);
				newWidget._wrapperWidget.set("selected", true);
				this._showChild(newWidget);
			}

			// Resize all children
			Array.forEach(this.getChildren(), function(child, childIndex) {
				var h = this.childrenHeight[childIndex];
				console.log("no animate transition: child #"+childIndex+" height = "+h+", child="+child);
				if ( h )
					child.resize( { w: this._width, h: h } );
			}, this);
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
