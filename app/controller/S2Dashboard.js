Ext.define('DashboardSelector.controller.S2Dashboard', {
    extend: 'Ext.app.Controller',
    stores: ['S2Dashboard'],
    models:['S2DashboardModel'],
     views: ['MainView','DashPickerView'],
    
    //fields
    dashboards:[], // stored in preferences and loaded
   
    onLaunch: function() {//fires after everything is loaded
        //handle the load of the dashboards
        this.loadDashboardStore();
        log("Dashboard Controller Launch Complete");
    },
    
    init: function() {        
        var self=this;
        
        //listen for events
        
        this.control({
            'dashpicker_view': {
              itemclick: self.dashboardSelectHandler
            },
            '#dashpicker_createbtn': { //wire up the btn to this controller
               click: self.launchDashboardCreator  
            }
        });
        if(OWF.Util.isRunningInOWF()) {           
            // Retrieve saved state
            OWF.Preferences.getUserPreference({
                namespace: "MITRESeamlessC2",
                name: 'MITRE.SeamlessCommander.DashboardData',
                onSuccess: function (response) {
                    if(response.value) {
                        var data = OWF.Util.parseJson(response.value);
                        log("User Prefs - MITRE.SeamlessCommander.DashboardData",response);
                    }
                }
            });
            // Subscribe to channel
            OWF.Eventing.subscribe('org.mitre.seamlessc2commander.dashboard', function (sender, msg, channel) {
                log("Dashboard Message Recd",msg);
            });
        }       
        
        log("Initialized Dashboard Controller");    
    },
    loadDashboardStore:function(){
        var self=this;
        var onFailure = function(error) {
            error(error);
        };   
        //load existing dashboards in the system
        var onSuccess = function(obj) {//obj.success obj.results obj.data
            var existing_dashs = obj.data;
            log("OWF Dashboards", existing_dashs);
            
            //get the user list of dashboards this manages
            OWF.Preferences.getUserPreference({
                namespace: "MITRESeamlessC2",
                name: 'MITRE.SeamlessCommander.dashboards',
                onSuccess:function(response){   
                    var newdashs = []; 
                    if(response && response.value){//may be empty or not created
                        //need to remove those dashboards that  may have been removed
                        var user_dashs = OWF.Util.parseJson(response.value); //in user preferences               
                    
                        //see if current dashboard is in prefs
                        for (var i = 0; i < existing_dashs.length; i++) {
                            var exist_dash_guid = existing_dashs[i].guid;
                            for(var j=0;j<user_dashs.length;j++){
                                var user_dash_guid = user_dashs[j].guid;
                                if(user_dash_guid == exist_dash_guid)
                                    newdashs.push(user_dashs[j]);
                            }
                        }                       
                    }
                    self.onS2DashboardStoreLoadFromPrefs(newdashs,self);                    
                } ,
                onFailure:onFailure
            });
            
        };           
                
        Ozone.pref.PrefServer.findDashboards({
            onSuccess:onSuccess,
            onFailure:onFailure
        });
    },
    //launches the Widget Selector Widget with the data
    launchDashboardCreator:function(){       
        var self=this;
        var ret_funct = ret_funct || function(response){
            log("Default return funct:",response);
        };
        //spawn the widget selector  
        log("Launching Dashboard Creator",DASHBOARDMAKER_WIDGET);
        OWF.Preferences.findWidgets({ //https://localhost:8443/owf/prefs/widget/listUserAndGroupWidgets
            searchParams: {
                widgetName: DASHBOARDMAKER_WIDGET
            },
            onSuccess: function(results) {
                log("#OWF widgets:"+results.length);
                if(results.length== 0){
                    log("No results for widget search:"+DASHBOARDMAKER_WIDGET);
                    error("No widget found: "+DASHBOARDMAKER_WIDGET);
                    return;
                }else if(results.length== 1){
                    log("One Result: "+results[0].path);                    
                }else{
                    for(var i=0;i<results.length;i++){
                        log("Results: "+results[i].value.namespace,results[i]);
                    };
                }
                var widget = results[0];
                
                //launch the widget
                var guid = widget.id;
                var dataString = OWF.Util.toString({});
                
                OWF.Launcher.launch({
                    guid: guid,
                    launchOnlyIfClosed: false,
                    data: dataString
                }, function(widget_info){
                    log(widget_info);
                    self.close();
                    ret_funct(widget_info);
                });
            } ,
            onFailure: function(err,status){
                error("Widget not found:"+DASHBOARDMAKER_WIDGET,err);
            }
        });
      
    },
    onS2DashboardStoreLoadFromPrefs:function (dashboards,self) {
        var dashguid = window.parent.location.href.replace(OWF.getContainerUrl()+"/#guid=","");
        if(dashboards) {
            
            self.dashboards = dashboards;            
            //see if current dashboard is in prefs
            var found=false;
            for(var i=0;i<dashboards.length;i++){
                var dash = dashboards[i];
                if(dash.guid == dashguid) found =true;
            }
            if(!found){
                //get the dashboard info
                self.dashboards.push({
                    name:window.parent.document.title,
                    guid:dashguid
                });
                self.saveDashboardToPrefs();//add to the list
            }
        }else{
            log("No dashboards in user preferences");           
            self.dashboards.push({
                name:window.parent.document.title,
                guid:dashguid
            });
            self.saveDashboardToPrefs();
        }
        
        //add to store
        Ext.each(self.dashboards,function(item,id){
            log("Record:",item);
            var d = Ext.create('DashboardSelector.model.S2DashboardModel', item);
            self.getS2DashboardStore().add(d);
        });
        //var comp = Ext.getCmp("dashpicker_view");
    
    //this.onS2DashboardStoreLoad(store.data.items);
    },
    //they selected a view in the dashboard view
    
    dashboardSelectHandler :function(view, record, row, index, e, eOpts ){
        log('dashboard selected',record);
        
        //they selected a different dashboard, store some config info then relocate
        if(record.data && record.data.name){
            var url= OWF.getContainerUrl()+"/#guid=" + record.data.guid;
            log("New Dashboard URL:"+url);
            OWF.Preferences.setUserPreference(
            {
                namespace:'MITRESeamlessC2',
                name:'MITRE.SeamlessCommander.previousDashboard',
                value:record.data.guid,
                onSuccess:function(pref){
                    log("Set Preferences",pref);
                    //Ext.MessageBox.confirm('Confirm', 'Are you sure ?', function(btn){
                    //  if(btn === 'yes'){
                    
                    window.parent.location.href= url ;
                    window.parent.location.reload(true);                                      
                },
                onFailure:function(a){
                    error("Set Preferences Error",a);
                }
            }
            );   
        }
    },
    saveDashboardToPrefs: function () {
        OWF.Preferences.setUserPreference({
            namespace:"MITRESeamlessC2",
            name: 'MITRE.SeamlessCommander.dashboards',
            value: OWF.Util.toString( this.dashboards ),
            onSuccess: function () {
                log("Save to prefs ok",arguments);
            },
            onFailure: function () {
                error("Save to prefs error",arguments)
            }
        });
    },
    getWidgetState:function(){
        //close widget https://github.com/ozoneplatform/owf/wiki/OWF-7-Developer-Widget-State-API https://github.com/ozoneplatform/owf/blob/master/web-app/examples/walkthrough/widgets/EventMonitor.html
        var eventMonitor = {};
        var state =Ozone.state.WidgetState;
        eventMonitor.widgetEventingController = Ozone.eventing.Widget.getInstance();
        eventMonitor.widgetState = Ozone.state.WidgetState.getInstance({
            widgetEventingController: eventMonitor.widgetEventingController,
            autoInit: true,
            onStateEventReceived: function(){
            //handle state events
            }
        });

        return eventMonitor.widgetState;
    },
    close:function(){
        this.getWidgetState().closeWidget();
    }
});


