geodash.meta = {};
geodash.meta.projects = [{"name":"geodash","version":"0.0.1","description":"geodash 0.0.1"},{"name":"sparc2","version":"0.0.1","description":"SPARC 2.x"}];
geodash.meta.plugins = [{"controllers":["GeoDashControllerBase.js","GeoDashControllerModal.js"],"directives":["svg.js","onLinkDone.js","onRepeatDone.js","geodashBtnClose.js","geodashBtnInfo.js","geodashBtn.js","geodashLabel.js","geodashTab.js","geodashTabs.js"],"enumerations":["dates.js"],"templates":["geodash_tab.tpl.html","geodash_tabs.tpl.html","geodash_btn_close.tpl.html","geodash_btn_info.tpl.html","geodash_btn.tpl.html","geodash_label.tpl.html"],"filters":["default.js","md2html.js","percent.js","tabLabel.js","as_float.js","add.js","title.js","as_array.js","sortItemsByArray.js","breakpoint.js","breakpoints.js","position_x.js","width_x.js","length.js","layer_is_visible.js","common/append.js","common/default_if_undefined.js","common/default_if_undefined_or_blank.js","common/extract.js","common/extractTest.js","common/inArray.js","common/not.js","common/prepend.js","common/parseTrue.js","common/ternary.js","common/ternary_defined.js","common/yaml.js","array/join.js","array/first.js","array/last.js","array/choose.js","format/formatBreakPoint.js","format/formatFloat.js","format/formatInteger.js","format/formatArray.js","format/formatMonth.js","math/eq.js","math/lte.js","math/gte.js","math/gt.js","string/replace.js","string/split.js","url/url_shapefile.js","url/url_geojson.js","url/url_kml.js","url/url_describefeaturetype.js"],"handlers":["clickedOnMap.js","hideLayer.js","hideLayers.js","layerLoaded.js","requestToggleComponent.js","showLayer.js","showLayers.js","switchBaseLayer.js","toggleComponent.js","zoomToLayer.js"],"schemas":["base.yml","baselayers.yml","featurelayers.yml","controls.yml","view.yml","pages.yml"],"modals":[],"project":"geodash","id":"base"},{"controllers":["controller_legend.js"],"directives":["geodashModalLayerCarto.js","geodashModalLayerMore.js","geodashModalLayerConfig.js","geodashSymbolCircle.js","geodashSymbolEllipse.js","geodashSymbolGraduated.js","geodashSymbolGraphic.js","geodashLegendBaselayers.js","geodashLegendFeaturelayers.js"],"templates":["modal/geodash_modal_layer_carto.tpl.html","modal/geodash_modal_layer_more.tpl.html","modal/geodash_modal_layer_config.tpl.html","symbol/symbol_circle.tpl.html","symbol/symbol_ellipse.tpl.html","symbol/symbol_graduated.tpl.html","symbol/symbol_graphic.tpl.html","legend_baselayers.tpl.html","legend_featurelayers.tpl.html"],"less":["legend.less"],"schemas":["legend_schema.yml"],"project":"geodash","id":"legend"},{"controllers":[],"directives":["geodashModalWelcome.js"],"templates":["modal/geodash_modal_welcome.tpl.html"],"project":"geodash","id":"welcome"},{"controllers":[],"directives":["geodashModalAbout.js"],"templates":["geodash_modal_about.tpl.html"],"project":"geodash","id":"about"},{"controllers":[],"directives":["geodashModalDownload.js"],"templates":["geodash_modal_download.tpl.html"],"project":"geodash","id":"download"},{"controllers":[],"directives":["geodashMapOverlays.js"],"templates":["map_overlays.tpl.html"],"less":["map_overlays.less"],"schemas":["map_overlays_schema.yml"],"project":"geodash","id":"overlays"},{"controllers":[],"directives":["geodashSidebarToggleLeft.js"],"templates":["geodash_sidebar_toggle_left.tpl.html"],"project":"geodash","id":"sidebar_toggle_left"},{"controllers":[],"directives":["geodashSidebarToggleRight.js"],"templates":["geodash_sidebar_toggle_right.tpl.html"],"project":"geodash","id":"sidebar_toggle_right"},{"controllers":["controller_breadcrumb.js"],"directives":["geodashBreadcrumbs.js"],"enumerations":["breadcrumbs.js"],"templates":["breadcrumbs.tpl.html"],"less":["breadcrumbs.less"],"project":"sparc2","id":"breadcrumbs"},{"controllers":["controller_calendar.js"],"directives":["geodashCalendar.js"],"templates":["calendar.tpl.html"],"less":["calendar.less"],"project":"sparc2","id":"calendar"},{"controllers":["controller_filter.js"],"directives":["geodashModalFilterMore.js","geodashFilterCheckbox.js","geodashFilterRadio.js","geodashFilterSlider.js","geodashFilterContainer.js"],"templates":["modal/modal_filter_more.tpl.html","filter/filter_checkbox.tpl.html","filter/filter_radio.tpl.html","filter/filter_slider.tpl.html","filter_container.tpl.html"],"less":["filter.less"],"project":"sparc2","id":"filter"},{"controllers":[{"name":"controller_map_map","path":"controller_map_map.js","handlers":[{"event":"toggleComponent","handler":"toggleComponent"}]}],"directives":[],"templates":[],"less":["main_map.less"],"project":"sparc2","id":"map_map"},{"controllers":["controller_sparc_sidebar.js"],"directives":["sparcSidebar.js","sparcSidebarFeatureLayer.js"],"templates":["sparc_sidebar.tpl.html","sparc_sidebar_featurelayer.tpl.html"],"less":["sidebar.less","sidebar-toggle.less"],"project":"sparc2","id":"sparc_sidebar"},{"controllers":[{"name":"controller_main","path":"controller_main.js","handlers":[{"event":"clickedOnMap","handler":"clickedOnMap"},{"event":"filterChanged","handler":"filterChanged"},{"event":"hideLayer","handler":"hideLayer"},{"event":"hideLayers","handler":"hideLayers"},{"event":"layerLoaded","handler":"layerLoaded"},{"event":"requestToggleComponent","handler":"requestToggleComponent"},{"event":"selectStyle","handler":"selectStyle"},{"event":"showLayer","handler":"showLayer"},{"event":"showLayers","handler":"showLayers"},{"event":"stateChanged","handler":"stateChanged"},{"event":"switchBaseLayer","handler":"switchBaseLayer"},{"event":"viewChanged","handler":"viewChanged"},{"event":"zoomToLayer","handler":"zoomToLayer"}]}],"directives":[],"templates":[],"handlers":["filterChanged.js","selectStyle.js","stateChanged.js","viewChanged.js"],"project":"sparc2","id":"main"},{"controllers":["SPARCControllerModalWelcome.js"],"directives":["sparcModalWelcome.js"],"templates":["sparc_modal_welcome.tpl.html"],"less":["sparc_welcome.less"],"modals":[{"name":"sparc_welcome","ui":{"mainClass":"","tabs":[{"target":"modal-sparc-welcome-intro","label":"Introduction"},{"target":"modal-sparc-welcome-about","label":"About"}]}}],"project":"sparc2","id":"sparc_welcome"}];
geodash.meta.controllers = [{"name":"controller_map_map","handlers":[{"event":"toggleComponent","handler":"toggleComponent"}]},{"name":"controller_main","handlers":[{"event":"clickedOnMap","handler":"clickedOnMap"},{"event":"filterChanged","handler":"filterChanged"},{"event":"hideLayer","handler":"hideLayer"},{"event":"hideLayers","handler":"hideLayers"},{"event":"layerLoaded","handler":"layerLoaded"},{"event":"requestToggleComponent","handler":"requestToggleComponent"},{"event":"selectStyle","handler":"selectStyle"},{"event":"showLayer","handler":"showLayer"},{"event":"showLayers","handler":"showLayers"},{"event":"stateChanged","handler":"stateChanged"},{"event":"switchBaseLayer","handler":"switchBaseLayer"},{"event":"viewChanged","handler":"viewChanged"},{"event":"zoomToLayer","handler":"zoomToLayer"}]}];
geodash.meta.modals = [{"name":"sparc_welcome","ui":{"mainClass":"","tabs":[{"target":"modal-sparc-welcome-intro","label":"Introduction"},{"target":"modal-sparc-welcome-about","label":"About"}]}}];