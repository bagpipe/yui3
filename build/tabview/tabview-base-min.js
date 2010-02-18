YUI.add("tabview-base",function(C){var D=C.ClassNameManager.getClassName,E="tabview",K="tab",L="content",J="panel",H="selected",I={},B={view:D(E),tabList:D(E,"tablist"),tab:D(K),tabControl:D(K,"link"),tabLabel:D(K,"label"),content:D(E,L),tabPanel:D(K,J),selectedTab:D(K,H),selectedContent:D(K,L,H)},G={tabList:"aria-tablist",tab:"aria-tab",tabControl:D(K,"link"),tabLabel:D(K,"label"),content:D(E,L),tabPanel:D(K,J),selectedTab:D(K,H),selectedContent:D(K,L,H)},F={tabview:"."+B.view,tablist:"ul",tab:"ul > li",link:"ul > li > a",label:"ul > li > a > em",content:"div",tabPanel:"div > div",selectedTab:"."+B.selectedTab,selectedContent:"."+B.selectedContent},A=function(M){if(A.superclass){A.superclass.constructor.apply(this,arguments);}else{this.initializer.apply(this,arguments);}};A.NAME="tabviewBase";A.queries=F;A.classNames=B;C.mix(A.prototype,{initializer:function(M){M=M||I;this._node=M.host||C.one(M.node);this.render();},initClassNames:function(M){C.Object.each(F,function(P,O){if(B[O]){var N=this.all(P);if(M!==undefined){N=N.item(M);}if(N){N.addClass(B[O]);}}},this._node);},_select:function(N){var Q=this._node,R=Q.one(F.selectedTab),P=Q.one(F.selectedContent),O=Q.all(F.tab).item(N),M=Q.all(F.tabPanel).item(N);if(R){R.removeClass(B.selectedTab);}if(P){P.removeClass(B.selectedContent);}if(O){O.addClass(B.selectedTab);}if(M){M.addClass(B.selectedContent);}},initState:function(){var N=this._node,O=N.one(F.selectedTab),M=O?N.all(F.tab).indexOf(O):0;this._select(M);},renderer:function(){this.initClassNames();this.initState();this.initEvents();},render:function(){this.renderer.apply(this,arguments);return this;},tabEventName:"click",initEvents:function(){this._node.delegate(this.tabEventName,this.onTabEvent,F.tab,this);},onTabEvent:function(M){M.preventDefault();this._select(this._node.all(F.tab).indexOf(M.currentTarget));},destructor:function(){this._node.detach("tabview|*");},destroy:function(){this.destructor.apply(this,arguments);}});C.TabviewBase=A;},"@VERSION@",{requires:["node-event-delegate","classnamemanager"]});