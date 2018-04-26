Ext.define('FileDemo.view.image.View', {
    extend: 'Ext.Container',
    requires: [
        'Ext.carousel.Carousel'
    ],
    xtype: 'images_view',
    controller: 'images_view',
    userCls: 'images-view',

    scrollable: true,

    padding: 15,

    layout: {
        type: 'vbox',
        align: 'center'
    },

    items: [{
        xtype: 'component',
        html: '必应每日壁纸'
    }, {
        xtype: 'carousel',
        reference: 'imgCarousel',
        width: 268,
        height: 200,
        defaults: {
            xtype: 'mx_img',
            width: 268,
            height: 200
        }
    }, {
        xtype: 'component',
        tpl: '<tpl for=".">\
    <div class="imgBlock">\
        <img src="{[ImgUtil.onePxImg]}" onload="ImgMgr.loadPic(this)" data-thumb="{thumbUrl}" data-img="{imgUrl}" {[values.showThumb ? \'data-showthumb\' : \'\']} {[values.showProgress ? \'data-showprogress\' : \'\']} data-errtip="{errTip}" />\
    </div>\
</tpl>',
        data: [{
            thumbUrl: 'http://img4.imgtn.bdimg.com/it/u=3980356738,3193671610&fm=11&gp=0.jpg',
            imgUrl: 'http://img.doooor.com/img/forum/201706/20/184532gb4ovdzd7fgw0k64.jpg',
            showThumb: false,
            showProgress: true,
            errTip: '图挂了'
        }, {
            thumbUrl: 'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=3990585178,1387559702&fm=27&gp=0.jpg',
            imgUrl: 'http://img.bizhi.sogou.com/images/2012/03/01/118481.jpg',
            showThumb: true,
            showProgress: false,
            errTip: '加载失败'
        }, {
            thumbUrl: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3591457461,3512621692&fm=27&gp=0.jpg',
            imgUrl: 'http://dl.bizhi.sogou.com/images/2012/04/22/208543.jpg',
            showThumb: false,
            showProgress: true,
            errTip: '加载失败'
        }, {
            thumbUrl: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=965848419,270600398&fm=27&gp=0.jpg',
            imgUrl: 'http://pic1.win4000.com/wallpaper/8/58523e1737494.jpg',
            showThumb: true,
            showProgress: false,
            errTip: '无图'
        }]
    }],

    initialize() {
        const me = this;
        me.callParent(arguments);

        // 点击 img 的事件监听
        ImgMgr.addViewerListener(me);
    }
});