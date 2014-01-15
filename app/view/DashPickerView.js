Ext.define('DashboardSelector.view.DashPickerView', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.dashpicker_view',
    id:'dashpicker_view',
    store: 'S2Dashboard',
    title:'Dashboards',
    hideHeaders: true,
    columns: [
        { header: 'Dashboards',  dataIndex: 'name' },
        {}
    ]
});