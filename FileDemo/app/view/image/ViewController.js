Ext.define('FileDemo.view.image.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.images_view',

    init() {
        const me = this,
            imgCarousel = me.lookup('imgCarousel');

        Ext.Ajax.request({
            url: 'http://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=5',
            success: function (r) {
                var obj = Ext.decode(r.responseText),
                    images = obj.images;
                if (images && images.length) {
                    images.forEach(x => {
                        var smallUrl = `http://www.bing.com${x.urlbase}_640x480.jpg`,
                            hdUrl = `http://www.bing.com${x.urlbase}_1920x1080.jpg`;
                        imgCarousel.add({
                            value: smallUrl
                        });
                    });
                }
            }
        });
    }
});