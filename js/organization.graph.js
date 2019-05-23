+function ($) {
    "use strict";
    function Component() {
    }

    Component.prototype.resize = function (direction,delta) {
        //direction:方向 left/right/up/down,  delta移动的偏移量，为正或为负
        if (direction=="left"){
            this.properties.x-= delta;
            this.properties.width+=delta;
        }
        if (direction=="right"){
            this.properties.width+=delta;
        }
        if (direction=="up")
        {
            this.properties.y-=delta;
            this.properties.height+=delta;
        }
        if (direction=="down")
        {
            this.properties.height+=delta;
        }
        this.unselect();
        this.destroy();
        this.render();
        return this;
    };
    Component.prototype.redrawLines = function () {
        //

        var me=this;
        debugger;
        $.each(this.designer.lines,function(idx,item){ //遍历每一条线，与此结点相关的都要重绘
            if (item.properties.source==me.properties.id)
            {
                item.destroy();
                var pos=me.getConnectorCenter(item.properties.sourceType);

                item.properties.sxy.x=pos.x;
                item.properties.sxy.y=pos.y;
                item.render({});
            }
            else if (item.properties.target==me.properties.id)
            {
                item.destroy();
                var pos=me.getConnectorCenter(item.properties.targetType);
                item.properties.txy.x=pos.x;
                item.properties.txy.y=pos.y;
                item.render({});
            }
        });


        return this;
    };
    Component.prototype.init = function (options) {
        if (options == undefined)
            options = {};
            var newProp={} ;
            $.extend(newProp,Component.DEFAULTS);
            $.extend(newProp,this.properties);
           $.extend(newProp,options);
           this.properties=newProp;
     
        this.group = new paper.Group();
        this.designer = undefined; //当前设计器，createElement时赋值
        //this.removeIndicator=undefined;
        var me = this;
        this.drag = false;
        this.isLine=false;
        this.resizers=null;
        this.connector = null; //活动的连线指示符
        this.group.onClick = function (event) {
            if (!me.designer.lining) //非画线状态才允许选中
                if (me.group.children[0].selected)
                    me.unselect();
                else
                    me.select();
        };
        this.group.onMouseDown = function (event) {
            if (!me.designer.lining) //非画线状态才允许拖动
            {
                if (event.event.button == 0 &&!me.isLine) //isLine指示是否线条，线条本身不支持拖动
                    me.onDragStart();
            }
            else
                me.designer.lineManager.dragStart(me.connector,event.point)
        };
        this.group.onMouseUp = function (event) {
            if (me.drag){
                me.drag = false;
                me.onDragEnd();
            }
            else  if (me.designer.lining && me.connector){
                me.designer.lineManager.dragEnd(me.connector,event.point)
             }
            document.body.style.cursor = 'default';
        };
        this.group.onMouseDrag = function (event) {
            if (me.drag && !me.designer.lining) //非画线状态才允许拖动
            {
                me.onDraging(event.delta)
            }
        };
        this.group.onMouseEnter=function(event)
        {
            if (!me.connector && me.designer.lining){
                me.unselect()
                me.connector=new Connector(me);
                me.connector.render();
            }
        };
        this.group.onMouseLeave=function(event)
        {
            if (me.connector){
                me.connector.destroy();
                me.connector=null;
            }
            document.body.style.cursor='default'
        };
        this.group.onMouseMove=function(event)
        {
            if (me.designer.lining && me.connector){
                var activeConnector=me.connector.hiTest(event);
                if (activeConnector)
                    activeConnector.visible=true;
            }
        };

        return this;
    };
    Component.prototype.getConnectorCenterByPos = function (pos)
    {
        var bounds = this.getBound();
        if (pos.x >= bounds.x - 5 && pos.x <= bounds.x + 5 && pos.y >= bounds.y + bounds.height / 2 - 5 && pos.y <= bounds.y + bounds.height / 2 + 5) {
            //在左连线指示器框中
            return { x: bounds.x, y: bounds.y + bounds.height / 2 };
        }
        else if (pos.x >= bounds.x + bounds.width - 5 && pos.x <= bounds.x + bounds.width + 5 && pos.y >= bounds.y + bounds.height / 2 - 5 && pos.y <= bounds.y + bounds.height / 2 + 5) {
            //在右连线指示器框中
            return { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 };
        }
        else if (pos.x >= bounds.x + bounds.width / 2 - 5 && pos.x <= bounds.x + bounds.width / 2 + 5 && pos.y >= bounds.y - 5 && pos.y <= bounds.y + 5) {
            //在上连线指示器框中
            return { x: bounds.x + bounds.width/2, y: bounds.y  };
        }
        else if (pos.x >= bounds.x + bounds.width / 2 - 5 && pos.x <= bounds.x + bounds.width / 2 + 5 && pos.y >= bounds.y + bounds.height - 5 && pos.y <= bounds.y + bounds.height + 5) {
            //在下连线指示器框中
            return { x: bounds.x + bounds.width/2, y: bounds.y + bounds.height };

        }
        else {
            return { x: bounds.x + bounds.width/2, y: bounds.y + bounds.height / 2 };
        }
    };
    Component.prototype.getConnectorCenter =function (direction)
    {
        var bounds=this.getBound();
        switch(direction)
        {
            case "left":
                return { x: bounds.x, y: bounds.y + bounds.height / 2 };
            case "right":
                return { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }
            case "up":
                return { x: bounds.x + bounds.width/2, y: bounds.y  };
            case "down":
                return { x: bounds.x + bounds.width/2, y: bounds.y + bounds.height };
            case "center":
                return {x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
        }
    };
    Component.prototype.getConnectorDirection =function (pos)
    {
        return "up"; //组织架构只允许上下连线
        var bounds = this.getBound();
        if (pos.x >= bounds.x - 5 && pos.x <= bounds.x + 5 && pos.y >= bounds.y + bounds.height / 2 - 5 && pos.y <= bounds.y + bounds.height / 2 + 5) {
            //在左连线指示器框中
            return "left";
        }
        else if (pos.x >= bounds.x + bounds.width - 5 && pos.x <= bounds.x + bounds.width + 5 && pos.y >= bounds.y + bounds.height / 2 - 5 && pos.y <= bounds.y + bounds.height / 2 + 5) {
            //在右连线指示器框中
            return "right";
        }
        else if (pos.x >= bounds.x + bounds.width / 2 - 5 && pos.x <= bounds.x + bounds.width / 2 + 5 && pos.y >= bounds.y - 5 && pos.y <= bounds.y + 5) {
            //在上连线指示器框中
            return "up";
      }
        else if (pos.x >= bounds.x + bounds.width / 2 - 5 && pos.x <= bounds.x + bounds.width / 2 + 5 && pos.y >= bounds.y + bounds.height - 5 && pos.y <= bounds.y + bounds.height + 5) {
            //在下连线指示器框中
            return "down";

        }
        else {
            //中心点连接
                return "center";
        }
    };
    Component.prototype.destroy = function ()
    {
        this.group.clear();
    };
    Component.prototype.getBound = function () {
        return this.group.children[0].bounds;
    };
    Component.prototype.select = function () {
        if (!this.designer.lining){
            this.group.children[0].selected = true;
            //if (!this.isLine)
                this.resizers=this.createResizers();
            //if (this.removeIndicator)
            //    this.removeIndicator.show();
            //else
            //    this.removeIndicator=new RemoveIndicator(this).show();
        }
    };
    //默认创建四个方位的大小调整器
    Component.prototype.createResizers=function(){
        var bounds=this.getBound();
        return [
            new LeftResizer(this,{x:bounds.x-1.5,y:bounds.y+bounds.height/2-1.5,width:3,height:3}).render(),
            new RightResizer(this,{x:bounds.x+bounds.width-1.5,y:bounds.y+bounds.height/2-1.5,width:3,height:3}).render(),
            new UpResizer(this,{x:bounds.x+bounds.width/2-1.5,y:bounds.y-1.5,width:3,height:3}).render(),
            new DownResizer(this,{x:bounds.x+bounds.width/2-1.5,y:bounds.y+bounds.height-1.5,width:3,height:3}).render()
        ];
    };
    Component.prototype.unselect = function () {
        this.group.children[0].selected = false;
        if (this.resizers){
            $.each(this.resizers,function(idx,item){
                item.destroy();
            });
            this.resizers.slice(0);
            this.resizers=null;
            document.body.style.cursor="default";
        }
        //if (this.removeIndicator){
        //    this.removeIndicator.hide();
        //    this.removeIndicator=null;
        //}

    };
    Component.prototype.onDragStart=function()
    {
        this.drag = true;
    }
    Component.prototype.onDraging=function(delta)
    {
        this.unselect(); //取消选中状态
        if (this.connector) //在拖动元素时如果有连线指示器则清除。
        {
            this.destroy();
            this.connector = null;
        }
            this.properties.x += delta.x;
        this.properties.y += delta.y;
        this.group.translate(delta.x,delta.y);
        this.redrawLines();
        document.body.style.cursor = 'move';
    }
    Component.prototype.onDragEnd=function()
    {

    }
    Component.DEFAULTS = $.extend({}, {
        width: 150,
        height: 50,
        x: 0,
        y: 0,
        id: "",
        backgroundColor:"white",
        backgroundImage:'',
        fontColor:'black',
        borderColor:'black',
        lineWeight:1,
        title: '',
        status: 1,
        runMode: 1,
        capacity:1
    });

    function CompanyNode() { 
        this.properties={};
        this.properties.typeName = "公司";
        this.properties.width = 150;
        this.properties.height = 50;
        this.properties.opacity = 0.5;
    }
    CompanyNode.prototype = $.extend({}, Component.prototype);
    CompanyNode.prototype = $.extend(CompanyNode.prototype, {
        render: function (options) {

            this.properties = $.extend(this.properties, options);
            var rect = new paper.Path.Rectangle({
                point: [0,0],
                size: [this.properties.width, this.properties.height],
                radius: 5,
                strokeWidth: 1,
                strokeColor: this.properties.borderColor,
                fillColor: this.properties.backgroundColor,
                opacity: this.properties.opacity
            });
            this.group.addChild(rect);
            this.group.translate(this.properties.x, this.properties.y);
            return this;
        }
    });
    function DepartmentNode() { 
        this.properties={};
        this.properties.typeName = "部门";
        this.properties.width = 150;
        this.properties.height = 50;
        this.properties.opacity = 0.5;
    }
    DepartmentNode.prototype = $.extend({}, Component.prototype);
    DepartmentNode.prototype = $.extend(DepartmentNode.prototype, {
        render: function (options) {

            this.properties = $.extend(this.properties, options);
            var rect = new paper.Path.Rectangle({
                point: [0,0],
                size: [this.properties.width, this.properties.height],
                radius: 5,
                strokeWidth: 1,
                strokeColor: this.properties.borderColor,
                fillColor: this.properties.backgroundColor,
                opacity: this.properties.opacity
            });
            this.group.addChild(rect);
            this.group.translate(this.properties.x, this.properties.y);
            return this;
        }
    });
    function PositionNode() { 
        this.properties={};
        this.properties.typeName = "岗位";
        this.properties.width = 150;
        this.properties.height = 50;
        this.properties.opacity = 0.5;
    }
    PositionNode.prototype = $.extend({}, Component.prototype);
    PositionNode.prototype = $.extend(PositionNode.prototype, {
        render: function (options) {

            this.properties = $.extend(this.properties, options);
            var rect = new paper.Path.Rectangle({
                point: [0,0],
                size: [this.properties.width, this.properties.height],
                radius: 5,
                strokeWidth: 1,
                strokeColor: this.properties.borderColor,
                fillColor: this.properties.backgroundColor,
                opacity: this.properties.opacity
            });
            this.group.addChild(rect);
            this.group.translate(this.properties.x, this.properties.y);
            return this;
        }
    });  
    function EmployeeNode() { 
        this.properties={};
        this.properties.typeName = "员工";
        this.properties.width = 150;
        this.properties.height = 50;
        this.properties.opacity = 0.5;
    }
    EmployeeNode.prototype = $.extend({}, Component.prototype);
    EmployeeNode.prototype = $.extend(EmployeeNode.prototype, {
        render: function (options) {

            this.properties = $.extend(this.properties, options);
            var rect = new paper.Path.Rectangle({
                point: [0,0],
                size: [this.properties.width, this.properties.height],
                radius: 5,
                strokeWidth: 1,
                strokeColor: this.properties.borderColor,
                fillColor: this.properties.backgroundColor,
                opacity: this.properties.opacity
            });
            this.group.addChild(rect);
            this.group.translate(this.properties.x, this.properties.y);
            return this;
        }
    });
    function CustomImage() { 
        this.properties={};
        this.properties.width = 20;
        this.properties.typeName = "图片";
        this.properties.height = 60;
        this.url="";
    }
    CustomImage.prototype = $.extend({}, Component.prototype);
    CustomImage.prototype = $.extend(CustomImage.prototype, {
        render: function (options) {

            this.properties = $.extend(this.properties, options);
            var motor = new paper.Raster({source:this.url,position:[this.properties.x,this.properties.y]});
            motor.scale(0.3);
            this.group.addChild(motor);
            return this;
        }
    });
    function BezierLine() {
        this.properties={};
        this.properties.typeName = "曲线";
        this.properties.strokeWidth = 2;
        this.properties.strokeColor = 'red';      
    }
    BezierLine.prototype = $.extend({}, Component.prototype);
    BezierLine.prototype = $.extend(BezierLine.prototype, {
        render: function (options) {
            this.isLine=true;
            this.properties=$.extend(this.properties,options)
            this.properties.x = Math.min(this.properties.sxy.x, this.properties.txy.x);
            this.properties.y = Math.min(this.properties.sxy.y, this.properties.txy.y);
            this.properties.width = Math.abs(this.properties.txy.x - this.properties.sxy.x);
            this.properties.height = Math.abs(this.properties.txy.y - this.properties.sxy.y);


            var wire = new paper.Path(this.calcPath(this.properties.targetType, this.properties.sxy.x, this.properties.sxy.y, this.properties.txy.x, this.properties.txy.y));
            wire.strokeWidth = this.properties.strokeWidth;
            wire.strokeColor=this.properties.strokeColor;
            wire.sendToBack();
            //this.group=new paper.Group();
            this.group.addChild(wire);
            //this.group.translate(this.properties.x, this.properties.y);
            return this;
        },
        calcPath:function(type, x1, y1, x2, y2)
            {
            var path= "";
            if(type =="left" || type == "right"|| type=="center")
            path= 'M ' + x1 + ', ' + y1 + 'C ' +
            (x1 + (x2 - x1) / 2) + ', ' + y1 + ' ' +
            (x2 - (x2 - x1) / 2) + ', ' + y2 + ' ' +
            x2 + ', ' + y2;
            else if (type=="up" || type == "down")
            path='M' + x1 + ', ' + y1 + 'C ' +
            x1 + ', ' + (y1 + (y2 - y1) / 2) + ' ' +
            x2 + ', ' + (y2 - (y2 - y1) / 2) + ' ' +
            x2 + ', ' + y2;
            return path;
        }
    });
    function PolyLine() {
        this.properties={};
        this.properties.typeName = "折线";
        this.properties.strokeWidth = 2;
        this.properties.strokeColor = 'red';      
    }
    PolyLine.prototype = $.extend({}, Component.prototype);
    PolyLine.prototype = $.extend(PolyLine.prototype, {
        render: function (options) {
            this.isLine=true;
            this.properties=$.extend(this.properties,options)

            //this.group=new paper.Group();
            this.properties.x=Math.min(this.properties.sxy.x,this.properties.txy.x);
            this.properties.y=Math.min(this.properties.sxy.y,this.properties.txy.y);
            this.properties.width = Math.abs(this.properties.txy.x - this.properties.sxy.x);
            this.properties.height = Math.abs(this.properties.txy.y - this.properties.sxy.y);

            if (this.properties.targetType=="left" || this.properties.targetType=="right")
            {
                if (this.properties.mxy1==undefined && this.properties.mxy2==undefined){
                    this.properties.mxy1=[this.properties.sxy.x+(this.properties.txy.x-this.properties.sxy.x)/2,this.properties.sxy.y];
                    this.properties.mxy2=[this.properties.sxy.x+(this.properties.txy.x-this.properties.sxy.x)/2,this.properties.txy.y];
                }
                else
                {
                    this.properties.mxy1[1]=this.properties.sxy.y;
                    this.properties.mxy2[1]=this.properties.txy.y;
                }
            }
            else
            {
                if (this.properties.mxy1==undefined && this.properties.mxy2==undefined){
                    this.properties.mxy1=[this.properties.sxy.x,(this.properties.txy.y-this.properties.sxy.y)/2+this.properties.sxy.y];
                    this.properties.mxy2=[this.properties.txy.x,(this.properties.txy.y-this.properties.sxy.y)/2+this.properties.sxy.y];
                }
                else
                {
                    this.properties.mxy1[0]=this.properties.sxy.x;
                    this.properties.mxy2[0]=this.properties.txy.x;
                }
            }
            
            //this.group=new paper.Group();
            var me = this;
            var drag = false;
            var line = new paper.Path();
            line.strokeWidth = 2;

            line.strokeColor = this.properties.strokeColor;    
            line.add(this.properties.sxy);
            line.add(this.properties.mxy1);
            line.add(this.properties.mxy2);
            line.add(this.properties.txy);
            //BezierArrow(line,targetType,this.properties.txy.x, this.properties.txy.y);
            this.group.addChild(line);

            //this.group.translate(this.properties.x, this.properties.y);
            return this;
        },
        createResizers:function()
        {
            if (this.properties.mxy1[0]==this.properties.mxy2[0] )
            {
                return [
                    new LeftResizer(this,{x:this.properties.mxy2[0]-1.5,y:this.properties.mxy1[1]+(this.properties.mxy2[1]-this.properties.mxy1[1])/2-1.5,width:3,height:3}).render()
                ];
            }   
            else
                return [
                    new UpResizer(this,{x:(this.properties.mxy2[0]-this.properties.mxy1[0])/2+this.properties.mxy1[0]-1.5,y:this.properties.mxy1[1]-1.5,width:3,height:3}).render()
                ];
        },
        resize : function (direction,delta) {
            //direction:方向 left/right/up/down,  delta移动的偏移量，为正或为负
            if (direction=="left"){
                this.properties.mxy1[0]-= delta;
                this.properties.mxy2[0]-= delta;
            }
            if (direction=="up")
            {
                this.properties.mxy1[1]-= delta;
                this.properties.mxy2[1]-= delta;
            }
            this.unselect();
            this.destroy();
            this.render();
            return this;
        }
    });

    function RemoveIndicator(component){
        this.component=component;
        var me=this;
        var bclose = new paper.PointText({
            point: [component.properties.x+component.properties.width+3, component.properties.y-3],
            content: '\u00D7',
            fillColor: "red",
            fontWeight:"Bold",
            fontFamily: "arial",
            fontSize: 16,
            justification: 'right',
            opacity: 0.75
        });
        this.group=new paper.Group();
        this.group.addChild(bclose);
        bclose.onMouseEnter = function() {
            this.set({opacity: 1});
            document.body.style.cursor = 'pointer';
        }
        bclose.onMouseLeave = function() {
            this.set({opacity: 0.5});
            document.body.style.cursor = 'default';
        }
        this.group.visible=false;
        bclose.onClick = function(event) {
            if (event.event.button == 0) {
                    me.component.designer.removeComponent(me.component);
            }
        }
        return this;
    }
    RemoveIndicator.prototype = {
        show: function () {
            this.group.visible=true; 
            return this;
        },
        hide:function(){
            this.group.remove();
            return this;
        }
    };

    function Connector(node) {

        this.node = node;
        this.left=null;
        this.top=null;
        this.right=null;
        this.bottom=null;
        this.self=null;
        this.group = null;
    }
    Connector.prototype = {

        destroy: function () {
            this.group.remove();
        },

        hiTest: function (event) {
            var bounds = this.node.getBound();
            this.self.visible=false;
            this.left.visible=false;
            this.top.visible=false;
            this.right.visible=false;
            this.bottom.visible=false;
            document.body.style.cursor="crosshair"
            if (event.point.x >= bounds.x - 5 && event.point.x <= bounds.x + 5 && event.point.y >= bounds.y + bounds.height / 2 - 5 && event.point.y <= bounds.y + bounds.height / 2 + 5)
            {
                //在左连线指示器框中
                return this.left
            }
            else if (event.point.x >= bounds.x + bounds.width - 5 && event.point.x <= bounds.x + bounds.width  + 5 && event.point.y >= bounds.y + bounds.height / 2 - 5 && event.point.y <= bounds.y + bounds.height / 2 + 5) {
                //在右连线指示器框中
                return this.right
            }
            else if (event.point.x >= bounds.x + bounds.width / 2 - 5 && event.point.x <= bounds.x + bounds.width / 2  + 5 && event.point.y >= bounds.y  - 5 && event.point.y <= bounds.y  + 5) {
                //在上连线指示器框中
                return this.top;
            }
            else if (event.point.x >= bounds.x + bounds.width / 2 - 5 && event.point.x <= bounds.x + bounds.width / 2  + 5 && event.point.y >= bounds.y + bounds.height - 5 && event.point.y <= bounds.y + bounds.height+ 5) {
                //在下连线指示器框中
                return this.bottom
            }
            else
            {
                return this.self;
            }
        },
        render: function () {
            var me = this;
            var color = 'white';
            this.group = new paper.Group();

            this.left = new paper.Path.Rectangle({
                point: [-5, this.node.getBound().height/2-5],
                size: [10,10],
                strokeColor: 'red',
                strokeWidth: 3
            })
            this.left.visible=false;
            this.group.addChild(this.left);

            this.top = new paper.Path.Rectangle({
                point: [this.node.getBound().width/2-5, -5],
                size: [10,10],
                strokeColor: 'red',
                strokeWidth: 3
            })
            this.group.addChild(this.top);
            this.top.visible=false;

            
            this.right = new paper.Path.Rectangle({
                point: [this.node.getBound().width-5, this.node.getBound().height/2-5],
                size: [10,10],
                strokeColor: 'red',
                strokeWidth: 3
            })
            this.group.addChild(this.right);
            this.right.visible=false;
            
            this.bottom = new paper.Path.Rectangle({
                point: [this.node.getBound().width/2-5, this.node.getBound().height-5],
                size: [10,10],
                strokeColor: 'red',
                strokeWidth: 3
            })
            this.group.addChild(this.bottom);
            this.bottom.visible=false;

            this.self= new paper.Path.Rectangle({
                point: [0, 0],
                size: [this.node.getBound().width, this.node.getBound().height],
                strokeColor: 'red',
                strokeWidth: 3
            })
            this.group.addChild(this.self);
            this.self.visible=false;

            var bounds = this.node.getBound();
            var topCross1 = new paper.Path.Line({ from: [bounds.width / 2 - 2.5,  -2.5], to: [ bounds.width / 2 + 2.5,  2.5], strokeColor: 'blue' });
            this.group.addChild(topCross1);
            var topCross2 = new paper.Path.Line({ from: [ bounds.width / 2 - 2.5, 2.5],to: [ bounds.width / 2 + 2.5, -2.5], strokeColor: 'blue' });
            this.group.addChild(topCross2);

            var rightCross1 = new paper.Path.Line({ from: [ bounds.width - 2.5,  bounds.height / 2 - 2.5], to: [ bounds.width + 2.5,  bounds.height / 2 + 2.5], strokeColor: 'blue' });
            this.group.addChild(rightCross1);
            var rightCross2 = new paper.Path.Line({ from: [ bounds.width - 2.5, bounds.height / 2 + 2.5], to: [ bounds.width + 2.5,  bounds.height / 2 - 2.5], strokeColor: 'blue' });
            this.group.addChild(rightCross2);

            var leftCross1 = new paper.Path.Line({ from: [ -2.5,  bounds.height / 2 - 2.5], to: [ 2.5, bounds.height / 2 + 2.5], strokeColor: 'blue' });
            this.group.addChild(leftCross1);
            var leftCross2 = new paper.Path.Line({ from: [ -2.5, bounds.height / 2 + 2.5], to: [ 2.5, bounds.height / 2 - 2.5], strokeColor: 'blue' });
            this.group.addChild(leftCross2);

            var bottomCross1 = new paper.Path.Line({ from: [bounds.width / 2 - 2.5,  bounds.height - 2.5], to: [ bounds.width / 2 + 2.5,  bounds.height + 2.5], strokeColor: 'blue' });
            this.group.addChild(bottomCross1);
            var bottomCross2 = new paper.Path.Line({ from: [bounds.width / 2 - 2.5, bounds.height + 2.5], to: [bounds.width / 2 + 2.5,  bounds.height  - 2.5], strokeColor: 'blue' });
            this.group.addChild(bottomCross2);


            this.group.bringToFront();
            this.group.translate(bounds.x,bounds.y);


            this.group.onMouseMove=function(event)
            {
                me.self.visible=false;
                me.left.visible=false;
                me.right.visible=false;
                me.bottom.visible=false;
                me.top.visible=false;
                var activeConnector=me.hiTest(event);
                if (activeConnector)
                    activeConnector.visible=true;
            }
            this.group.onMouseLeave=function(event)
            {
                me.self.visible=false;
                me.left.visible=false;
                me.right.visible=false;
                me.bottom.visible=false;
                me.top.visible=false;
                document.body.style.cursor="default"
            }
            return this;
        }

    };
    function Resizer(node,bounds) {

        this.node = node;
        this.group = null;
        this.direction="";//单一节点方向
        this.bounds=bounds;
    }
    /*1.11及以前，大小调节器为固定的组件边界四个方位的大小调整，实际情形并不是所有组件具有四个方位的调整，比如三角形只有三个点，折线只有一个点，
    *所以从1.12开始，将resizer定一为单一大小调整，具体的位置由所依附的组件来定义，即由组件创建大小调整器。
    */
    Resizer.prototype = {

        destroy: function () {
            this.group.remove();
        },
        render: function () {
            var me = this;
            var color = 'white';
            this.group = new paper.Group();

            var bounds = this.bounds;
            var thisResizer = new paper.Path.Rectangle({ point: [bounds.x ,bounds.y ], size:[this.bounds.width,this.bounds.height], strokeColor: 'blue',fillColor:'blue' });
            this.group.addChild(thisResizer);

            this.group.bringToFront();
            var drag = false;
            var tool=new paper.Tool();
            this.group.onMouseEnter=function(event){
                document.body.style.cursor=me.getCursor();
            };
            this.group.onMouseMove=function(event){
                document.body.style.cursor=me.getCursor();
            };
            this.group.onMouseLeave=function(event){
                document.body.style.cursor="default";
            };
            this.group.onMouseDown=function(event) //在当前resizer上按下鼠标
            {
                drag=true;
                tool.activate();
            };

            tool.onMouseUp=function(event) //在设计器其它位置释放（包括自身：缩小的情形）
            {
                //调整组件大小，并重绘组件和与之关联的所有连线
                if (drag){
                    var direction=me.direction;
                    var node=me.node.resize(direction,me.getDelta({x:me.bounds.x+me.bounds.width/2,y:me.bounds.y+me.bounds.height/2},event.point));
                    if (!node.isLine)
                        node.redrawLines();
                    drag=false;
                }
            };
            tool.onMouseDrag=function(event) //在设计器其它位置拖放（包括自身：缩小的情形）
            {
                //调整组件大小，并重绘组件和与之关联的所有连线

            };
            return this;
        }

    };
    function UpResizer(node,bounds){
        this.node=node;
        this.bounds=bounds;
        this.direction="up";
    }
    UpResizer.prototype = $.extend({}, Resizer.prototype);
    UpResizer.prototype = $.extend(UpResizer.prototype, {
        getDelta:function(sourcePos,targetPos){
                return sourcePos.y-targetPos.y;
        },
        getCursor:function(){
            return "n-resize";
        }
    });
    function DownResizer(node,bounds){
        this.node=node;
        this.bounds=bounds;
        this.direction="down";
    }
    DownResizer.prototype = $.extend({}, Resizer.prototype);
    DownResizer.prototype = $.extend(DownResizer.prototype, {
        getDelta:function(sourcePos,targetPos){
            return targetPos.y-sourcePos.y;
        },
        getCursor:function(){
            return "s-resize";
        }
    });
    function LeftResizer(node,bounds){
        this.node=node;
        this.bounds=bounds;
        this.direction="left";
    }
    LeftResizer.prototype = $.extend({}, Resizer.prototype);
    LeftResizer.prototype = $.extend(LeftResizer.prototype, {
        getDelta:function(sourcePos,targetPos){
            return sourcePos.x-targetPos.x;
        },
        getCursor:function(){
            return "w-resize";
        }
    });
    function RightResizer(node,bounds){
        this.node=node;
        this.bounds=bounds;
        this.direction="right";
    }
    RightResizer.prototype = $.extend({}, Resizer.prototype);
    RightResizer.prototype = $.extend(RightResizer.prototype, {
        getDelta:function(sourcePos,targetPos){
            return targetPos.x-sourcePos.x;
        },
        getCursor:function(){
            return "e-resize";
        }
    });
    function LineManager(designer) {
        this.designer = designer;
        this.line = null;//当前跟随线
        this.start = null;//当前正在画线的起点元素
        this.startPos=null;
        var tool=new paper.Tool();
        //设计器元素之外的移动也要显示跟随线，
        var me=this;
        tool.onMouseMove=function(event){
            if (me.line){
                me.draging(event.point);
            }

        }
        tool.onMouseUp=function(event)
        {
            //设计器元素之外的释放不生成连线，清除已有开始结点等信息，
            if (me.line)
            {
                me.line.remove();
                me.start=null;
                me.startPos=null;
                me.line=null;
            }
        }
    }
    LineManager.prototype = {
        dragStart: function (co,pos) {
                this.start = co;
                var xy = co.node.getConnectorCenterByPos(pos); //获取当前鼠标位置处连接点的中央坐标
                this.startPos=xy;
                this.line = new paper.Path.Line({
                    from: [xy.x, xy.y],
                    to: [xy.x, xy.y],
                    strokeWidth: 2,
                    strokeColor: 'red'
                });
        },
        draging: function (pos) {
            if (this.line !== null ) {
                var txy = this.calcLine(this.startPos.x, this.startPos.y, pos.x, pos.y);
                this.line.set({ pathData: 'M' + this.startPos.x + ',' + this.startPos.y + ' L' + txy.x + ',' + txy.y });
            }
        },
        dragEnd:function(co,pos)
        {
            var xy = co.node.getConnectorCenterByPos(pos); //获取当前鼠标位置处连接点的中央坐标
            if (this.line !== null  ) {
                if (this.start.node.properties.id!=co.node.properties.id){
                    debugger;
  
                    this.designer.createLine(this.designer.lineType,{sourceType:this.start.node.getConnectorDirection(this.startPos),targetType:co.node.getConnectorDirection(pos),source:this.start.node.properties.id,target:co.node.properties.id,sxy:this.startPos,txy:xy});
                }
                this.line.remove();

            }
            this.start=null; //清除画线状态，等待重新画线
            this.startPos=null;
            
        },

        calcLine: function (x1, y1, x2, y2) {
            var vx = x2 - x1;
            var vy = y2 - y1;
            var d = Math.sqrt(vx * vx + vy * vy);
            vx /= d;
            vy /= d;
            d = Math.max(0, d - 5);
            return {
                'x': Math.round(x1 + vx * d),
                'y': Math.round(y1 + vy * d)
            }
        },
        getLines:function(component){
                var me=this;
                var lines=[];
                $.each(this.designer.lines,function(idx,item){ //遍历每一条线，与此结点相关的都要重绘
                    if (item.properties.source==component.properties.id)
                    {
                        lines.push(item);
                    }
                    else if (item.properties.target==component.properties.id)
                    {
                        lines.push(item);
                    }
                })
                return lines; 
        }
    }
    // OrganizationDesigner 公共类定义
    // ===============================
    var OrganizationDesigner = function (element, options) {
        this.init(element, options)
        this.nodes = {};//设计器上所有节点集合
        this.lines = {};//设计器上所有线条
        this.lining = false;//是否正在画线状态
        this.lineType="曲线";
        this.lineManager = new LineManager(this);
    }
    if (!paper) throw new Error('OrganizationDesigner requires paper.js')
    OrganizationDesigner.DEFAULTS = $.extend({}, {
        content: '',
        color: "white",
        font_color: "black",
        opacity: 0.5,
        height:"600px",
        width:"100%"

    })
    /*编号累加*/
    OrganizationDesigner.prototype.createId = function() {
        var idx = 1;
         var name = "";
         var found=false;
         while (true)
         {
           name = "e" + idx;
           var element = this.nodes[name];
           if (element)
               idx++;
           else{
               break;
           }
         }
         while (true)
         {
           name = "e" + idx;
           var element = this.lines[name];
           if (element)
               idx++;
           else{
               break;
           }
         }
         return name;
    }
    OrganizationDesigner.prototype.createElement = function (typeName, options) {
        if (!options.id)
            options.id = this.createId(); //为元素增加id属性
        var element = null;
        switch (typeName) {
            case "公司":
                element = new CompanyNode().init().render(options);
                break;
            case "部门":
                element= new DepartmentNode().init().render(options);
                break;
            case "岗位":
                element = new PositionNode().init().render(options);
                break;
            case "员工":
                element = new EmployeeNode().init().render(options);
                break; 
            case "图片":
                element = new CustomImage().init().render(options);
                break; 
        }
        this.nodes[element.properties.id] = element;
        element.designer = this;

    }    /*增加元素*/
    OrganizationDesigner.prototype.createLine= function (typeName, options) {
        if (!options.id)
            options.id = this.createId(); //为元素增加id属性
        var element = null;
        switch (typeName) {
            case "曲线":
                element = new BezierLine().init().render(options);
                break;
            case "折线":
                element=new PolyLine().init().render(options);
                break;
        }
        this.lines[element.properties.id] = element;
        element.designer = this;

    }  
    OrganizationDesigner.prototype.setLineStatus = function (status) {
        if (status=="移动")
            this.lining = false;
            else
            {
                this.lining=true;
                if (status=="曲线")
                    this.lineType="曲线";
                else if (status="折线")
                    this.lineType="折线";
            }
    }

    OrganizationDesigner.prototype.init = function (element, options) {
        this.enabled = true;
        debugger;

        this.$element = $(element);
        this.id= element instanceof jQuery ? element[0].id : element.id;
        
        this.options = this.getOptions(options)
        
        this.initUI();

        this.htmlCanvas = this.$element.find("canvas");

        this.htmlCanvas.on("dragover", function (event) {
            event.preventDefault();
        });
        this.textPos=null;
        var me = this;
        this.htmlCanvas.on("drop", function (event) {
            event.preventDefault();
            debugger;
            var data = null;
            if (event.dataTransfer == undefined && event.originalEvent != undefined)
                data = event.originalEvent.dataTransfer.getData("text");
            else if (event.dataTransfer != undefined)
                data = event.dataTransfer.getData("text");
            var drag = false;
            me.createElement(data, { x: event.originalEvent.offsetX, y: event.originalEvent.offsetY });

        });
        var touchComponent=null; //当前拖动的组件
        var touchPos=null; //上次位置
        this.htmlCanvas.on("touchstart",function(event){
            event.preventDefault();
            var touch=event.originalEvent.touches[0]||event.originalEvent.changedTouches[0];
            var offset=$(this).offset();
            $.each(me.nodes,function(idx,val){
                try{
                    if(val.group){
                        var group=val.group.hitTest([touch.pageX-offset.left,touch.pageY-offset.top])
                        if (group)
                        {
                            if (!me.textPos)
                                me.textPos = new paper.PointText({
                                    point: [20, 40],
                                    content: '拖动：x:'+touch.pageX+",y:"+touch.pageY,
                                    fillColor: 'blue',
                                    fontFamily: '宋体',
                                    fontWeight: 'bold',
                                    fontSize: 14
                                });
                            else
                                me.textPos.set({ content: '拖动：x:'+touch.pageX+",y:"+touch.pageY})
                            touchPos={x:touch.pageX-offset.left,y:touch.pageY-offset.top};
                            touchComponent=val;
                            val.onDragStart();
                            return false;
                        }
                    }
                }
                catch(e){
                    me.textPos = new paper.PointText({
                        point: [20, 40],
                        content: '错误:'+e,
                        fillColor: 'blue',
                        fontFamily: '宋体',
                        fontWeight: 'bold',
                        fontSize: 14
                    });
                }
            })
        })
        this.htmlCanvas.on("touchmove",function(event){
            event.preventDefault();
            if (touchComponent)
            {
                var touch=event.originalEvent.touches[0]||event.originalEvent.changedTouches[0];
                var offset=$(this).offset();
                //当前位置减去上次位置，获得偏移量
                var delta={x:touch.pageX-offset.left-touchPos.x,y:touch.pageY-offset.top-touchPos.y};
                touchComponent.onDraging(delta);
                touchPos={x:touch.pageX-offset.left,y:touch.pageY-offset.top};//当前位置
            }

        })
        this.htmlCanvas.on("touchend",function(event){
            event.preventDefault();
            if (touchComponent)
            {
                touchComponent.onDragEnd()
                touchComponent=null;
            }

        })
       
        this.options = $.extend({ 'raster': 0 }, this.options || {});

        //初始化设计器代码
        this.canvas = paper.setup(this.htmlCanvas[0].id);
        this.canvas.project.view.viewSize = new paper.Size(1900,1600);
        this.originalPoint = this.canvas.project.view.center;//保留中心
        this.centerPoint = { x: 0, y: 0 };
        
    }
    //NOTE:initUI初始化界面：工具条、画布
    OrganizationDesigner.prototype.initUI=function(){
        var me=this;
        if (!this.options.readonly)
        {
            var toolbarTpl="<div class=\" odui-graph\" style=\"width:"+me.options.width+";height:"+me.options.height+"\"><div class=\"odui-toolbars\"><div class=\" odui-toolbar\"><div class=\" odui-box\"><div title=\"源代码\"class=\" odui-for-source odui-icon\"></div></div><div class=\" odui-box\"><div class=\" odui-separator\"></div></div><div class=\" odui-box\"><div title=\"新建\"class=\" odui-icon odui-for-new\"></div></div><div class=\" odui-box\"><div title=\"打开\"class=\" odui-icon odui-for-open\"></div></div><div class=\" odui-box\"><div title=\"保存\"class=\" odui-icon odui-for-save\"></div></div><div class=\" odui-box\"><div title=\"输出图片\"class=\" odui-icon odui-for-print\"></div></div><div class=\" odui-box\"><div class=\" odui-separator\"></div></div></div><div class=\" odui-toolbar\"><div class=\" odui-box\"><div title=\"清除\"class=\" odui-for-clear odui-icon\"></div></div><div class=\" odui-box\"><div title=\"删除\"class=\" odui-icon odui-for-delete\"></div></div><div class=\" odui-box\"><div title=\"全选\"class=\" odui-icon odui-for-selectall\"></div></div><div class=\" odui-box\"><div title=\"移到前面\"class=\" odui-icon odui-for-bringfront\"></div></div><div class=\" odui-box\"><div title=\"移到后面\"class=\" odui-icon odui-for-bringback\"></div></div><div class=\" odui-box\"><div class=\" odui-separator\"></div></div></div><div class=\" odui-toolbar\"><div class=\" odui-box\"><div title=\"标尺\"class=\" odui-for-ruler odui-icon\"></div></div><div class=\" odui-box\"><div title=\"左对齐\"class=\" odui-for-align-left odui-icon\"></div></div><div class=\" odui-box\"><div title=\"右对齐\"class=\" odui-icon odui-for-align-right\"></div></div><div class=\" odui-box\"><div title=\"上对齐\"class=\" odui-icon odui-for-align-up\"></div></div><div class=\" odui-box\"><div title=\"下对齐\"class=\" odui-icon odui-for-align-down\"></div></div><div class=\" odui-box\"><div title=\"垂直同距\"class=\" odui-icon odui-for-equal-ud\"></div></div><div class=\" odui-box\"><div title=\"水平同距\"class=\" odui-icon odui-for-equal-lr\"></div></div><div class=\" odui-box\"><div class=\" odui-separator\"></div></div></div>"+
            "<div class=\" odui-toolbar\"><div class=\" odui-box\"><div name=\""+this.id+"linkType\" title=\"移动\"class=\" odui-for-pointer odui-icon odui-checked\"></div></div><div class=\" odui-box\"><div name=\""+this.id+"linkType\"title=\"曲线\"class=\" odui-for-curve odui-icon\"></div></div><div class=\" odui-box\"><div name=\""+this.id+"linkType\"title=\"折线\"class=\" odui-for-zline odui-icon\"></div></div><div class=\" odui-box\"><div class=\" odui-separator\"></div></div></div></div>"+
            "<div class=\"odui-designer\"><div class=\"odui-toolbox\"><div title=\"公司\"class=\" odui-toolbox-button odui-toolbox-company odui-component\"draggable=\"true\"></div><div title=\"部门\"class=\" odui-toolbox-button odui-toolbox-dept odui-component\"draggable=\"true\"></div><div title=\"岗位\"class=\" odui-toolbox-button odui-toolbox-position odui-component\"draggable=\"true\"></div><div title=\"员工\"class=\" odui-toolbox-button odui-toolbox-employee odui-component\"draggable=\"true\"></div></div><div class=\"odui-designer-canvas\"></div></div>";
            
            this.$element.append(toolbarTpl);
            $.each(this.$element.find("div[name='"+this.id+"linkType']"),function(idx,val){
                $(val).on("click",function(){
                    me.setLineStatus($(this).attr("title"));
                    $(this).parent().parent().find("div[name='"+me.id+"linkType']").removeClass("odui-checked");
                    $(this).addClass("odui-checked");
                    debugger;
                })
            })
            this.$element.find("div[class='odui-designer-canvas']").append("<canvas height=\""+me.options.height+"\""+" width=\""+me.options.width+"\""+" id=\""+this.id+"Canvas\" class=\"odui-canvas\"></canvas>");
            $('.odui-component').each(function () {
                $(this).on("dragstart", function (event) {
                    var evt = event || window.event;
                    if (evt.dataTransfer == undefined && evt.originalEvent != undefined) {
                        var stext = $(evt.target)[0].title;
                        evt.originalEvent.dataTransfer.setData("text", stext);
                    }
                    else if (evt.dataTransfer != undefined)
                        evt.dataTransfer.setData("text", $(evt.target)[0].title);
                });
            });
        }
        else
        {
            var toolbarTpl="<div class=\" odui-graph\" style=\"width:"+me.options.width+"px;height:"+me.options.height+"px\"><div class=\"odui-designer\" style=\"width:"+me.options.width+"px;height:"+me.options.height+"px\"><canvas  id=\""+this.id+"Canvas\" class=\"odui-canvas\"></canvas></div></div>";
            this.$element.append(toolbarTpl);
        }
    }
    // NOTE: OrganizationDesigner 原型定义
    // ================================
    OrganizationDesigner.prototype.constructor = OrganizationDesigner
    OrganizationDesigner.prototype.getDefaults = function () {
        return OrganizationDesigner.DEFAULTS
    }
    OrganizationDesigner.prototype.getOptions = function (options) {
        options = $.extend({}, this.getDefaults(), this.$element.data(), options)
        return options;
    }
    OrganizationDesigner.prototype.clear = function () {
        var me = this;
        $.each(this.nodes, function (idx, item) {
            item.destroy();
            delete me.nodes[item.properties.id]
        })
        $.each(this.lines, function (idx, item) {
            item.destroy();
            delete me.lines[item.properties.id]
        })
    }
    OrganizationDesigner.prototype.selectAll = function (status) {
        var me = this;
        $.each(this.nodes, function (idx, item) {
            if (status)
                item.select();
            else
                item.unselect();
        })
    }
    OrganizationDesigner.prototype.removeComponent = function (component) {
        var me=this;
        if (!component.isLine){
            $.each(me.lineManager.getLines(component),function(index,val){
                //遍历组件相连的每一条线
                val.destroy();//删除线
                delete me.lines[val.properties.id]
            })
            component.unselect(); //取消选择，删除组件的连接点，大写调整锚点
            component.destroy(); //删除组件
            delete me.nodes[component.properties.id]
        }
        $.each(this.lines, function (idx, item) {
            if (item.properties.id==component.properties.id)
            {
                //如果要删除是连线
                item.unselect();
                item.destroy();
                delete me.lines[item.properties.id]
            }
        })
    }
    OrganizationDesigner.prototype.open = function (content) {
        //此处打开操作：清除原来内容，并渲染新内容的代码
        this.clear();//先清除原来内容
        var contentObj = JSON.parse(content);
        for (var en in contentObj.nodes)
        {
            var el = contentObj.nodes[en];
            this.createElement(el.properties.typeName, el.properties)
        }
        for (var l1 in contentObj.lines)
        {
            debugger;
            var line = contentObj.lines[l1];
            this.createLine(line.properties.typeName, line.properties)
        }
    }
    OrganizationDesigner.prototype.hasContent = function () {
        return this.getTitle() || this.getContent()
    }
    OrganizationDesigner.prototype.getContent = function () {
        debugger;
        return JSON.stringify({ "nodes": this.nodes, "lines": this.lines },
            function (k, v) {
                if (k == "designer"||k=="resizer"||k=="removeIndicator") {
                    return undefined;
                }
                return v;
            });
    }
    var old = $.fn.organizationDesigner
    // OrganizationDesigner 插件定义,扩展jquery函数
    // =========================
    $.fn.organizationDesigner = function (option) {
        debugger;
        return new OrganizationDesigner(this, option);
    }
    $.fn.organizationDesigner.Constructor = OrganizationDesigner
    // OrganizationDesigner 非冲突
    // ===================
    $.fn.organizationDesigner.noConflict = function () {
        $.fn.organizationDesigner = old
        return this
    }

}($);