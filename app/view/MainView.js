Ext.define('DashboardSelector.view.MainView', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.main_view',
    width: '100%',
    height:300,
    //title: 'Seamless C2',
    border:0,
    
    defaults: {
        border:0
        
    },
    //autoShow: true,
    layout: {
        type: 'vbox'
    },
    items: [
    {
        xtype: 'dashpicker_view'
    },
    {
        xtype:'button',        
        margin:'10 0 0 0',
        id:'dashpicker_createbtn',
        text: "Create a Dashboard",
        cls: ''
    }
]
});