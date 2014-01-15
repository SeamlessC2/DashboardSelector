
var initSeamlessC2 = function(){
           
    Ext.application({
        requires: ['Ext.container.Viewport'],
    
        name: 'DashboardSelector',

        appFolder: 'app',
        controllers: [
        'S2Dashboard'
        ],
        launch: function() {            
                    
            Ext.create('Ext.container.Viewport', {
                id: "main-panel",
                defaults: {
                    border:false
                },
                //width: 600,
                //height: 350,                   
                items: [
                {
                  xtype: 'main_view'
                }
                ]
            });
        }
    });
};

owfdojo.addOnLoad(function() {   
    //OWF.relayFile = Ozone.util.contextPath() + '/js/eventing/rpc_relay.uncompressed.html';
    
    if(OWF.Util.isRunningInOWF()) {
        OWF.ready(function(){            
            initSeamlessC2();
        });
    }
});


           
