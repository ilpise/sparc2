geodash.config = {
  'click_radius': 2.0,
  'search': {
    'datasets': [sparc2.typeahead.datasets, geodash.typeahead.datasets],
    'codecs': [sparc2.bloodhound.codec, geodash.bloodhound.codec]
  },
  'dynamicStyleFunctionWorkspaces': [
    sparc2.dynamicStyleFn,
    geodash.dynamicStyleFn
  ],
  'transport':
  {
    'littleEndian': false
  },
  'popup':
  {
    'height': '309px',
    'context': {
      'e': extract,
      'extract': extract,
      'extractFloat': extractFloat,
      'popatrisk': sparc2.calc.popatrisk,
      'filters': [
        'vam_filter_fcs',
        'vam_filter_csi'
      ],
      "vam": function(admin1_code, x) {
        return extract('data.vam.admin1.'+admin1_code+'.'+x, geodash.initial_data, '');
      }
    },
    'listeners': {
      'show': [
        sparc2.popup.initChart
      ]
    }
  }
};

geodash.init_country = function(appName)
{

  var url_context_summary = geodash.api.getEndpoint("sparc2_context_summary")
    .replace("{{ iso3 }}", geodash.initial_state.iso3);

  $.when(
    $.ajax({dataType: "json", url: url_context_summary})
  ).done(function(response_context_summary)
  {
    geodash.initial_data["layers"]["context"]["data"]["summary"] = response_context_summary[0];

    geodash.breakpoints = {};

    $.each(geodash.initial_data["layers"]["context"]["data"]["summary"]["all"]["breakpoints"], function(k, v){
      geodash.breakpoints["context_"+k] = v;
    });

    geodash.init_country_main_app(appName);
  });
};

geodash.init_country_main_app = function(appName)
{
  geodash.app = app = angular.module(appName, ['ngRoute','ngSanitize']);

  var initFn = ['templates', 'filters', 'directives', 'factory'];
  for(var i = 0; i < initFn.length; i++)
  {
    geodash.init[initFn[i]](app);
  }

  // Initialize UI interaction for intents.
  // Listen's for events bubbling up to body element, so can initialize before children.
  geodash.init.listeners();

  /*
  init_sparc_controller_main will kick off a recursive search for controllers
  to add to the angular app/module.  However, the initialization code in
  app.controller(...function(){XXXXX}) won't actually execute until
  angular.bootstrap is called.  Therefore, each controller should Initialize
  in a breadth-first sequential order.

  If you miss a component with ng-controller, bootstrap will attempt
  to load it on its own within angular.bootstrap.  That'll error out
  and is not good.  So you NEED!!! to get to it first!!!!!!
  */

  geodash.init.controller_base(app);

  var mainController = $('#geodash-main');
  init_sparc_controller_main(mainController, app);

  angular.bootstrap(document, [appName]);
};

geodash.init_countryhazardmonth = function(appName)
{
  console.log("Running geodash.init_countryhazardmonth");

  var url_popatrisk_summary = geodash.api.getEndpoint("sparc2_popatrisk_summary")
    .replace("{{ iso3 }}", geodash.initial_state.iso3)
    .replace("{{ hazard }}", geodash.initial_state.hazard);

  var url_context_summary = geodash.api.getEndpoint("sparc2_context_summary")
    .replace("{{ iso3 }}", geodash.initial_state.iso3);

  var url_vam_geojson = geodash.api.getEndpoint("sparc2_vam_geojson")
    .replace("{{ iso3 }}", geodash.initial_state.iso3);

/*
$.ajax({
  url: url_popatrisk_summary,
  mimeType: "application/octet-stream",
  beforeSend: function(xhr){
    xhr.overrideMimeType('text\/plain; charset=x-user-defined');  // This is
  }
})
*/

  $.when(
    $.ajax({dataType: "json", url: url_popatrisk_summary}),
    $.ajax({dataType: "json", url: url_context_summary}),
    $.ajax({dataType: "json", url: url_vam_geojson})
  ).done(function(
    response_popatrisk_summary,
    response_context_summary,
    response_vam_geojson
    ){
    var response_popatrisk_summary_content_type = response_popatrisk_summary[2].getResponseHeader("Content-Type");
    if(response_popatrisk_summary_content_type == "application/json")
    {
      geodash.initial_data["layers"]["popatrisk"]["data"]["summary"] = response_popatrisk_summary[0];
    }
    else
    {
      geodash.initial_data["layers"]["popatrisk"]["data"]["summary"]  = sparc2.transport.decode.summary(response_popatrisk_summary[0]);
    }

    geodash.initial_data["layers"]["context"]["data"]["summary"] = response_context_summary[0];

    // Load VAM Data
   geodash.initial_data.layers.vam.data.geojson = response_vam_geojson[0];
   geodash.initial_data["data"]["vam"] = {
     "admin1": {}
   };
   var features = extract("layers.vam.data.geojson.features", geodash.initial_data, []);
   for(var i = 0; i < features.length; i++)
   {
     var admin1_code = extract("properties.admin1_code", features[i]);
     var admin1_vam = extract("properties.vam", features[i]);
     if(angular.isDefined(admin1_code) && angular.isDefined(admin1_vam))
     {
       geodash.initial_data.data.vam.admin1[""+admin1_code] = admin1_vam;
     }
   }

    // Load Breakpoints
    geodash.breakpoints = {};
    if("all" in geodash.initial_data["layers"]["popatrisk"]["data"]["summary"])
    {
      $.each(geodash.initial_data["layers"]["popatrisk"]["data"]["summary"]["all"]["breakpoints"], function(k, v){
        geodash.breakpoints["popatrisk_"+k] = v;
      });
    }
    if("all" in geodash.initial_data["layers"]["context"]["data"]["summary"])
    {
      $.each(geodash.initial_data["layers"]["context"]["data"]["summary"]["all"]["breakpoints"], function(k, v){
        geodash.breakpoints["context_"+k] = v;
      });
    }

    geodash.init_countryhazardmonth_main_app(appName);
  });
};

geodash.init_countryhazardmonth_main_app = function(appName)
{
  geodash.app = app = angular.module(appName, ['ngRoute','ngSanitize', 'ngCookies']);

  var initFn = ['templates', 'filters', 'directives', 'factory'];
  for(var i = 0; i < initFn.length; i++)
  {
    geodash.init[initFn[i]](app);
  }

  // Initialize UI interaction for intents.
  // Listen's for events bubbling up to body element, so can initialize before children.
  geodash.init.listeners();

  /*
  init_sparc_controller_main will kick off a recursive search for controllers
  to add to the angular app/module.  However, the initialization code in
  app.controller(...function(){XXXXX}) won't actually execute until
  angular.bootstrap is called.  Therefore, each controller should Initialize
  in a breadth-first sequential order.

  If you miss a component with ng-controller, bootstrap will attempt
  to load it on its own within angular.bootstrap.  That'll error out
  and is not good.  So you NEED!!! to get to it first!!!!!!
  */

  geodash.init.controller_base(app);

  var mainController = $('#geodash-main');
  init_sparc_controller_main(mainController, app);

  angular.bootstrap(document, [appName]);
};

var init_sparc_controller = function(that, app)
{
  var controllerName = that.data('controllerName');
  var controllerType = that.data('controllerType');

  app.controller(controllerName, function($scope, $element) {

    init_intents($($element), $scope);

  });
};

geodash.meta = {};
geodash.meta.projects = [{"name":"geodash","version":"0.0.1","description":"geodash 0.0.1"},{"name":"sparc2","version":"0.0.1","description":"SPARC 2.x"}];
geodash.meta.plugins = [{"controllers":["GeoDashControllerBase.js","GeoDashControllerModal.js"],"directives":["geodashBase.js","svg.js","onLinkDone.js","onRepeatDone.js","geodashBtnClose.js","geodashBtnInfo.js","geodashBtn.js","geodashLabel.js","geodashTab.js","geodashTabs.js"],"enumerations":["dates.js"],"templates":["geodash_tab.tpl.html","geodash_tabs.tpl.html","geodash_btn_close.tpl.html","geodash_btn_info.tpl.html","geodash_btn.tpl.html","geodash_label.tpl.html"],"filters":[],"handlers":["clickedOnMap.js","filterChanged.js","hideLayer.js","hideLayers.js","layerLoaded.js","requestToggleComponent.js","selectStyle.js","showLayer.js","showLayers.js","stateChanged.js","switchBaseLayer.js","ol3/toggleComponent.js","viewChanged.js","zoomIn.js","zoomOut.js","zoomToLayer.js","ol3/printMap.js","ol3/toggleFullScreen.js"],"schemas":["base.yml","baselayers.yml","assets.yml","featurelayers.yml","controls.yml","view.yml","servers.yml","pages.yml"],"modals":[],"project":"geodash","id":"base"},{"filters":["default.js","md2html.js","percent.js","tabLabel.js","as_float.js","add.js","title.js","as_array.js","sortItemsByArray.js","breakpoint.js","breakpoints.js","position_x.js","width_x.js","length.js","layer_is_visible.js","common/append.js","common/default_if_undefined.js","common/default_if_undefined_or_blank.js","common/extract.js","common/extractTest.js","common/inArray.js","common/not.js","common/prepend.js","common/parseTrue.js","common/ternary.js","common/ternary_defined.js","common/yaml.js","array/arrayToObject.js","array/join.js","array/first.js","array/last.js","array/choose.js","css/css.js","css/ellipsis.js","format/formatBreakPoint.js","format/formatFloat.js","format/formatInteger.js","format/formatArray.js","format/formatMonth.js","math/eq.js","math/lte.js","math/gte.js","math/gt.js","string/replace.js","string/split.js","string/stringToObject.js","url/url_shapefile.js","url/url_geojson.js","url/url_kml.js","url/url_describefeaturetype.js"],"project":"geodash","id":{"branch":"master","url":"https://github.com/geodashio/geodash-plugin-filters.git"}},{"name":"geodash-plugin-legend","controllers":["GeoDashControllerLegend.js"],"directives":["geodashMapLegend.js"],"templates":["map_legend.tpl.html"],"less":["legend.less"],"schemas":["legend.yml"],"project":"geodash","id":"geodash-plugin-legend"},{"controllers":[],"directives":["geodashModalWelcome.js"],"templates":["modal/geodash_modal_welcome.tpl.html"],"project":"geodash","id":"welcome"},{"controllers":[],"directives":["geodashModalAbout.js"],"templates":["geodash_modal_about.tpl.html"],"project":"geodash","id":"about"},{"controllers":[],"directives":["geodashModalDownload.js"],"templates":["geodash_modal_download.tpl.html"],"project":"geodash","id":"download"},{"name":"geodash-plugin-overlays","controllers":["GeoDashControllerOverlays.js"],"directives":["geodashMapOverlays.js"],"templates":["map_overlays.tpl.html"],"less":["map_overlays.less"],"schemas":["map_overlays_schema.yml"],"project":"geodash","id":"geodash-plugin-overlays"},{"controllers":[],"directives":["geodashSidebarToggleLeft.js"],"templates":["geodash_sidebar_toggle_left.tpl.html"],"project":"geodash","id":"sidebar_toggle_left"},{"controllers":[],"directives":["geodashSidebarToggleRight.js"],"templates":["geodash_sidebar_toggle_right.tpl.html"],"project":"geodash","id":"sidebar_toggle_right"},{"name":"sparc2","endpoints":["endpoints.yml"],"project":"sparc2","id":"sparc2"},{"controllers":["SPARCControllerCalendar.js"],"directives":["sparcCalendar.js"],"templates":["sparc_calendar.tpl.html"],"less":["sparc_calendar.less"],"project":"sparc2","id":"file:///home/vagrant/sparc2-plugin-calendar.git"},{"name":"geodash-plugin-map-map","controllers":[{"name":"GeoDashControllerMapMap","path":"GeoDashControllerMapMap.js","handlers":[{"event":"toggleComponent","handler":"toggleComponent"}]}],"directives":["geodashMapMap.js"],"templates":["map_map.tpl.html"],"less":["map_map.less"],"project":"sparc2","id":"geodash-plugin-map-map"},{"name":"sparc2-plugin-sidebar","controllers":["SPARCControllerSidebar.js"],"directives":["sparcSidebar.js","sparcSidebarFeatureLayer.js","sparcModalFilterMore.js","sparcFilterCheckbox.js","sparcFilterRadio.js","sparcFilterSlider.js"],"templates":["sparc_sidebar.tpl.html","sparc_sidebar_featurelayer.tpl.html","modal/modal_filter_more.tpl.html","filter/filter_checkbox.tpl.html","filter/filter_radio.tpl.html","filter/filter_slider.tpl.html"],"less":["sidebar.less","sidebar-toggle.less","filter.less"],"project":"sparc2","id":"sparc2-plugin-sidebar"},{"name":"sparc2-plugin-welcome","controllers":["SPARCControllerModalWelcome.js"],"directives":["sparcModalWelcome.js"],"templates":["sparc_modal_welcome.tpl.html"],"less":["sparc_welcome.less"],"modals":[{"name":"sparc_welcome","ui":{"mainClass":"","tabs":[{"target":"modal-sparc-welcome-intro","label":"Introduction"},{"target":"modal-sparc-welcome-about","label":"About"}]}}],"project":"sparc2","id":"sparc2-plugin-welcome"},{"name":"geodash-plugin-main","controllers":[{"name":"GeoDashControllerMain","path":"GeoDashControllerMain.js","handlers":[{"event":"clickedOnMap","handler":"clickedOnMap"},{"event":"filterChanged","handler":"filterChanged"},{"event":"hideLayer","handler":"hideLayer"},{"event":"hideLayers","handler":"hideLayers"},{"event":"layerLoaded","handler":"layerLoaded"},{"event":"requestToggleComponent","handler":"requestToggleComponent"},{"event":"selectStyle","handler":"selectStyle"},{"event":"showLayer","handler":"showLayer"},{"event":"showLayers","handler":"showLayers"},{"event":"stateChanged","handler":"stateChanged"},{"event":"switchBaseLayer","handler":"switchBaseLayer"},{"event":"viewChanged","handler":"viewChanged"},{"event":"zoomIn","handler":"zoomIn"},{"event":"zoomOut","handler":"zoomOut"},{"event":"zoomToLayer","handler":"zoomToLayer"},{"event":"printMap","handler":"printMap"},{"event":"toggleFullScreen","handler":"toggleFullScreen"}]}],"directives":["geodashMain.js"],"templates":["main.tpl.html"],"handlers":[],"project":"sparc2","id":"geodash-plugin-main"}];
geodash.meta.controllers = [{"name":"GeoDashControllerMapMap","handlers":[{"event":"toggleComponent","handler":"toggleComponent"}]},{"name":"GeoDashControllerMain","handlers":[{"event":"clickedOnMap","handler":"clickedOnMap"},{"event":"filterChanged","handler":"filterChanged"},{"event":"hideLayer","handler":"hideLayer"},{"event":"hideLayers","handler":"hideLayers"},{"event":"layerLoaded","handler":"layerLoaded"},{"event":"requestToggleComponent","handler":"requestToggleComponent"},{"event":"selectStyle","handler":"selectStyle"},{"event":"showLayer","handler":"showLayer"},{"event":"showLayers","handler":"showLayers"},{"event":"stateChanged","handler":"stateChanged"},{"event":"switchBaseLayer","handler":"switchBaseLayer"},{"event":"viewChanged","handler":"viewChanged"},{"event":"zoomIn","handler":"zoomIn"},{"event":"zoomOut","handler":"zoomOut"},{"event":"zoomToLayer","handler":"zoomToLayer"},{"event":"printMap","handler":"printMap"},{"event":"toggleFullScreen","handler":"toggleFullScreen"}]}];
geodash.meta.modals = [{"name":"sparc_welcome","ui":{"mainClass":"","tabs":[{"target":"modal-sparc-welcome-intro","label":"Introduction"},{"target":"modal-sparc-welcome-about","label":"About"}]}}];
geodash.templates = {static:{}};
geodash.templates.static["geodash_tab.tpl.html"] = "<li\n  role=\"presentation\"\n  ng-class=\"(active && active != \'false\') ? \'active\' : \'\'\">\n  <a\n    href=\"#{{ target }}\"\n    aria-controls=\"{{ target }}\"\n    role=\"tab\"\n    data-toggle=\"tab\"\n    style=\"padding-left:8px; padding-right: 8px; height: {{ height | default_if_undefined : \'auto\'}}\">{{ label }}</a>\n</li>\n";
geodash.templates.static["geodash_tabs.tpl.html"] = "<ul class=\"nav nav-tabs nav-justified\" role=\"tablist\">\n  <li\n    ng-repeat=\"x in ui.tabs track by $index\"\n    role=\"presentation\"\n    ng-class=\"$first ? \'active\' : \'\'\">\n    <a\n      href=\"#{{ x.target }}\"\n      aria-controls=\"{{ x.target }}\"\n      role=\"tab\"\n      data-toggle=\"tab\"\n      style=\"padding-left:8px; padding-right: 8px; height: {{ height | default_if_undefined : \'auto\'}}\">{{ x.label }}</a>\n  </li>\n</ul>\n";
geodash.templates.static["geodash_btn_close.tpl.html"] = "<button\n  type=\"button\"\n  class=\"close\"\n  data-dismiss=\"{{ dismiss | default_if_undefined: \'modal\' }}\"\n  aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n";
geodash.templates.static["geodash_btn_info.tpl.html"] = "<div\n  class=\"input-group-addon btn btn-primary\"\n  data-toggle=\"tooltip\"\n  data-placement=\"{{ placement | default_if_undefined : \'left\' }}\"\n  ng-attr-title=\"{{ info }}\">\n  <i class=\"fa fa-info-circle\"></i>\n</div>\n";
geodash.templates.static["geodash_btn.tpl.html"] = "<div\n  ng-class=\"[\'input-group-addon\',\'btn\',(\'btn-\'|add: mode),((mode == \'clear\' || mode ==\'off\') ? \'btn-danger\': \'\'),((mode == \'on\') ? \'btn-success\': \'\'),((mode == \'edit\') ? \'btn-primary btn-edit\': \'\')]\"\n  data-target=\"{{ target }}\"\n  data-toggle=\"{{ info | ternary_defined : \'tooltip\' : undefined }}\"\n  data-placement=\"{{ placement | default_if_undefined : \'left\' }}\"\n  ng-attr-title=\"{{ info }}\">\n  <i ng-class=\"[\'fa\',(mode == \'clear\' ? \'fa-times\' : \'\'),(mode == \'on\' ? \'fa-check\' : \'\'),(mode == \'off\' ? \'fa-circle-o\' : \'\'),(mode == \'edit\' ? \'fa-pencil-square-o\' : \'\')]\"></i>\n</div>\n";
geodash.templates.static["geodash_label.tpl.html"] = "<label for=\"{{ target }}\" class=\"col-sm-3 control-label\" ng-bind-html=\"content\"></label>\n";
geodash.templates.static["map_legend.tpl.html"] = "<div\n  id=\"geodash-map-legend\"\n  class=\"geodash-map-legend\"\n  style=\"{{ style() }}\">\n  <div class=\"container-fluid\">\n    <div\n      ng-repeat=\"layer in visibleFeaturelayers track by $index\"\n      ng-init=\"layerIndex = $index\"\n      ng-if=\"layer.title | ternary_defined : true : false\"\n      class=\"geodash-map-legend-layer noselect row\"\n      style=\"margin-bottom:8px;\"\n      data-layer=\"{{ layer.id }}\">\n      <div ng-if=\"getLegendType(layer) == \'legendgraphic\'\" class=\"col-sm-12\">\n        <div class=\"row\" style=\"margin-bottom:8px;\">\n          <div class=\"{{ class(0) }}\">\n            <img\n              style=\"{{ getLegendGraphicStyle(layer) | css }}\"\n              ng-src=\"{{ getLegendGraphicURL(layer) }}\">\n          </div>\n          <div class=\"{{ class(1) }}\">\n            <span\n              class=\"h5\"\n              style=\"{{ {\'margin\': \'0\'} | ellipsis | css }}\"\n              data-toggle=\"tooltip\"\n              data-placement=\"bottom\"\n              data-container=\"#geodash-map-legend\"\n              ng-attr-title=\"{{ layer.title }}\"\n              ng-bind-html=\"layer.title\"></span>\n          </div>\n        </div>\n        <div class=\"row\"><div class=\"col-sm-12\"><span class=\"h6\" ng-bind-html=\"\'Source: \'+layer.source.attribution\"></span></div></div>\n      </div>\n      <div ng-if=\"getLegendType(layer) == \'graduated\'\" ng-init=\"style = getCurrentStyle(layer)\" class=\"col-sm-12\">\n        <div class=\"row\">\n          <div class=\"col-sm-12\">\n            <span\n              class=\"h5\"\n              style=\"{{ {} | ellipsis | css }}\"\n              data-toggle=\"tooltip\"\n              data-placement=\"bottom\"\n              data-container=\"#geodash-map-legend\"\n              ng-attr-title=\"{{ layer.title }}\"\n              ng-bind-html=\"layer.title\"></span>\n          </div>\n        </div>\n        <div class=\"row\" style=\"margin-bottom:8px;\"><div class=\"col-sm-12\"><span class=\"h6\" ng-bind-html=\"(\'(\'+style.description+\')\') | md2html\"></span></div></div>\n        <div class=\"row\" style=\"margin-bottom:8px;\">\n          <div class=\"col-sm-12\" ng-init=\"ramp = getColorRamp(layer)\">\n            <svg width=\"100%\" height=\"20px\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n              <rect\n                ng-repeat=\"color in ramp track by $index\"\n                ng-attr-x=\"{{ $index | percent: ramp.length }}%\"\n                y=\"0\"\n                ng-attr-width=\"{{ 1 | percent: ramp.length }}%\"\n                ng-attr-height=\"{{ \'20px\' }}\"\n                ng-attr-fill=\"{{ color }}\"\n                stroke-width=\"1\"\n                stroke=\"#000000\"/>\n            </svg>\n          </div>\n        </div>\n        <div class=\"row\"><div class=\"col-sm-12\"><span class=\"h6\" ng-bind-html=\"\'Source: \'+layer.source.attribution\"></span></div></div>\n      </div>\n    </div>\n  </div>\n</div>\n";
geodash.templates.static["geodash_modal_welcome.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button geodash-btn-close></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ welcome.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li role=\"presentation\" class=\"active\">\n            <a\n              href=\"#modal-welcome-general\"\n              aria-controls=\"modal-welcome-general\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">General</a>\n          </li>\n          <li role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-welcome-about\"\n              aria-controls=\"modal-welcome-about\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">About</a>\n          </li>\n        </ul>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-welcome-general\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"welcome.general | md2html | default:\'No body given.\'\"></span>\n          </div>\n          <div\n            id=\"modal-welcome-about\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"welcome.about | md2html | default:\'No body given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates.static["geodash_modal_about.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button geodash-btn-close></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ about.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li\n            role=\"presentation\"\n            ng-class=\"$first ? \'active\' : \'\'\"\n            ng-repeat=\"pane in about.panes track by $index\">\n            <a\n              href=\"#{{ pane.id }}\"\n              aria-controls=\"{{ pane.id }}\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\"\n              ng-bind-html=\"pane.tab.label | default:\'Default\' | tabLabel\"></a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            ng-repeat=\"pane in about.panes track by $index\"\n            id=\"{{ pane.id }}\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"pane.content | md2html | default:\'No content given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates.static["geodash_modal_download.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button geodash-btn-close></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ download.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li\n            role=\"presentation\"\n            ng-class=\"$first ? \'active\' : \'\'\"\n            ng-repeat=\"pane in download.panes track by $index\">\n            <a\n              href=\"#{{ pane.id }}\"\n              aria-controls=\"{{ pane.id }}\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\"\n              ng-bind-html=\"pane.tab.label | default:\'Default\' | tabLabel\"></a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            ng-repeat=\"pane in download.panes track by $index\"\n            id=\"{{ pane.id }}\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"pane.content | md2html | default:\'No content given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates.static["map_overlays.tpl.html"] = "<div\n  id=\"geodash-map-overlays\"\n  class=\"geodash-map-overlays\">\n  <div ng-repeat=\"overlay in dashboard.overlays track by $index\">\n    <div ng-if=\"overlay.link | ternary_defined : false : true\">\n      <div\n        ng-if=\"overlay.type == \'text\'\"\n        data-overlay-index=\"{{ $index }}\"\n        data-overlay-type=\"text\"\n        class=\"geodash-map-overlay {{ overlay.intent | ternary_defined : \'geodash-intent\' : \'\' }}\"\n        width=\"{{ overlay.width | default_if_undefined : \'\' }}\"\n        height=\"{{ overlay.height | default_if_undefined : \'\' }}\"\n        style=\"{{ style(overlay.type, overlay) }}\"\n        data-intent-name=\"{{ overlay.intent.name }}\"\n        data-intent-data=\"{{ overlay.intent.properties | arrayToObject | json : 0 }}\"\n        data-intent-ctrl=\"geodash-map-overlays\"\n        on-link-done=\"overlayLoaded\"\n        ng-bind-html=\"overlay.text.content | md2html\">\n      </div>\n      <div\n        ng-if=\"overlay.type == \'image\'\"\n        data-overlay-index=\"{{ $index }}\"\n        data-overlay-type=\"image\"\n        class=\"geodash-map-overlay {{ overlay.intent | ternary_defined : \'geodash-intent\' : \'\' }}\"\n        style=\"display: inline-block; {{ style(overlay.type, overlay) }}\"\n        on-link-done=\"overlayLoaded\"\n        data-intent-name=\"{{ overlay.intent.name  }}\"\n        data-intent-data=\"{{ overlay.intent.properties | arrayToObject | json : 0 }}\"\n        data-intent-ctrl=\"geodash-map-overlays\">\n        <img ng-src=\"{{ imageURL(overlay) }}\" width=\"{{ overlay.width }}\" height=\"{{ overlay.height }}\">\n      </div>\n    </div>\n    <a\n      ng-if=\"overlay.link | ternary_defined : true : false\"\n      ng-href=\"{{ overlay.link.url }}\"\n      target=\"{{ overlay.link.target }}\">\n      <div\n        ng-if=\"overlay.type == \'text\'\"\n        data-overlay-index=\"{{ $index }}\"\n        data-overlay-type=\"text\"\n        class=\"geodash-map-overlay\"\n        width=\"{{ overlay.width | default_if_undefined : initial }}\"\n        height=\"{{ overlay.height | default_if_undefined : initial }}\"\n        style=\"{{ style(overlay.type, overlay) }}\"\n        on-link-done=\"overlayLoaded\"\n        ng-bind-html=\"overlay.text.content | md2html\">\n      </div>\n      <div\n        ng-if=\"overlay.type == \'image\'\"\n        data-overlay-index=\"{{ $index }}\"\n        data-overlay-type=\"image\"\n        class=\"geodash-map-overlay\"\n        style=\"display: inline-block; {{ style(overlay.type, overlay) }}\"\n        on-link-done=\"overlayLoaded\">\n        <img ng-src=\"{{ imageURL(overlay) }}\" width=\"{{ overlay.width }}\" height=\"{{ overlay.height }}\">\n      </div>\n    </a>\n  </div>\n</div>\n";
geodash.templates.static["geodash_sidebar_toggle_left.tpl.html"] = "<div\n  id=\"geodash-map-sidebar-toggle-left\"\n  class=\"geodash-intent geodash-map-sidebar-toggle geodash-map-sidebar-toggle-left btn btn-primary sidebar-open sidebar-left-open\"\n  data-toggle=\"tooltip\"\n  data-placement=\"bottom\"\n  title=\"Click to toggle sidebar.\"\n  data-intent-name=\"requestToggleComponent\"\n  data-intent-data=\"{&quot;selector&quot;:&quot;{{ selector }}&quot;,&quot;component&quot;:&quot;sidebar&quot;,&quot;position&quot;:&quot;left&quot;}\"\n  data-intent-ctrl=\"geodash-map-sidebar-toggle-left\">\n  <div\n    style=\"padding: 4px;\">\n    <span class=\"icon-arrow-gt\">&gt;&gt;</span>\n    <span class=\"icon-arrow-lt\">&lt;&lt;</span>\n  </div>\n</div>\n";
geodash.templates.static["geodash_sidebar_toggle_right.tpl.html"] = "<div\n  id=\"geodash-map-sidebar-toggle-right\"\n  class=\"geodash-intent geodash-map-sidebar-toggle geodash-map-sidebar-toggle-right btn btn-primary sidebar-open sidebar-right-open\"\n  data-toggle=\"tooltip\"\n  data-placement=\"bottom\"\n  title=\"Click to toggle sidebar.\"\n  data-intent-name=\"requestToggleComponent\"\n  data-intent-data=\"{&quot;selector&quot;:&quot;{{ selector }}&quot;,&quot;component&quot;:&quot;sidebar&quot;,&quot;position&quot;:&quot;right&quot;}\"\n  data-intent-ctrl=\"geodash-map-sidebar-toggle-right\">\n  <div\n    style=\"padding: 4px;\">\n    <span class=\"icon-arrow-gt\">&gt;&gt;</span>\n    <span class=\"icon-arrow-lt\">&lt;&lt;</span>\n  </div>\n</div>\n";
geodash.templates.static["sparc_calendar.tpl.html"] = "<nav\n  id=\"sparc-map-calendar\"\n  class=\"sparc-map-calendar\">\n  <ul class=\"nav nav-justified geodash-radio-group\">\n    <li\n      ng-repeat=\"month in months track by $index\">\n      <a\n        ng-class=\"state.month == month.num ? \'btn btn-primary selected geodash-intent geodash-radio geodash-on\' : \'btn btn-default geodash-intent geodash-radio\'\"\n        title=\"{{ month.long }}\"\n        ng-href=\"linkForMonth(month)\"\n        data-intent-name=\"stateChanged\"\n        data-intent-data=\"{&quot;month&quot;: {{ month.num }} }\"\n        data-intent-ctrl=\"sparc-map-calendar\"\n        data-intent-class-on=\"btn-primary selected\"\n        data-intent-class-off=\"btn-default\" ng-bind-html=\"month.short3 | title\"></a>\n    </li>\n  </ul>\n</nav>\n";
geodash.templates.static["map_map.tpl.html"] = "<div id=\"map\" class=\"geodash-map-map\"></div>\n";
geodash.templates.static["sparc_sidebar.tpl.html"] = "<div\n  id=\"geodash-sidebar-left\"\n  class=\"geodash-sidebar geodash-sidebar-left geodash-controller sidebar-open sidebar-left-open\">\n  <div style=\"width:100%;\">\n      <div class=\"geodash-sidebar-header\">\n        <div class=\"geodash-sidebar-header-left\">\n          <a href=\"/\"><img ng-src=\"{{ ui.header.logo.src }}\" alt=\"{{ ui.header.logo.alt }}\"></a>\n        </div>\n        <div class=\"geodash-sidebar-header-right\">\n          <div><a class=\"geodash-sidebar-header-title\" href=\"/\" ng-bind-html=\"ui.header.title\"></a></div>\n          <div><a class=\"geodash-sidebar-header-subtitle\" href=\"/\" ng-bind-html=\"ui.header.subtitle\"></a></div>\n        </div>\n        <div class=\"geodash-sidebar-header-right-2\">\n          <div ng-bind-html=\"state.country_title\"></div>\n        </div>\n      </div>\n    <div geodash-tabs></div>\n    <div class=\"tab-content\">\n      <div\n        id=\"geodash-sidebar-left-welcome\"\n        role=\"tabpanel\"\n        class=\"geodash-sidebar-pane tab-pane fade in active\">\n        <div\n          ng-bind-html=\"dashboard.welcome.intro | md2html\">\n        </div>\n      </div>\n      <div\n        id=\"geodash-sidebar-left-charts\"\n        role=\"tabpanel\"\n        class=\"geodash-sidebar-pane tab-pane fade\">\n        <div\n          ng-repeat=\"chart in dashboard.sidebar.ui.charts track by $index\"\n          on-repeat-done=\"chart_done\"\n          data-repeat-index=\"{{ $index }}\"\n          id=\"geodash-sidebar-left-charts-chart-{{ chart.id }}\">\n          <div>\n            <h6\n              style=\"text-align:center;\"\n              ng-bind-html=\"chart.title | md2html\"></h6>\n          </div>\n          <div\n            id=\"{{ chart.element }}\"\n            class=\"geodash-sidebar-chart\"\n            style=\"width:360px;margin:0 auto;\"\n          ></div>\n          <div class=\"footnote\" ng-bind-html=\"chart.description | md2html\"></div>\n        </div>\n      </div>\n      <div\n        id=\"geodash-sidebar-left-layers\"\n        role=\"tabpanel\"\n        class=\"geodash-sidebar-pane tab-pane fade\"\n        style=\"padding: 24px 24px 50px 24px;\">\n        <div>\n          <div class=\"input-group\">\n            <span class=\"input-group-addon\" id=\"country-addon\">Country</span>\n            <input\n              id=\"country-input\"\n              name=\"country-input\"\n              type=\"text\"\n              class=\"typeahead form-control\"\n              style=\"height: auto;\"\n              placeholder=\"Country (e.g., Haiti or Philippines)\"\n              aria-describedby=\"country-addon\"\n              data-placeholder=\"Country (e.g., Haiti, Nepal, or Philippines)\"\n              data-typeahead-datasets=\"Countries\"\n              data-initial-value=\"{{ {\'id\': state.iso3, \'text\': state.country_title } | json }}\"\n              data-target-scope-id=\"geodash-sidebar-left\"\n              data-target-scope-path=\"country\"\n              data-search-output=\"id\"\n              data-template-empty=\"<div class=&quot;alert alert-danger empty-message&quot;>Unable to find country</div>\">\n              <div\n                class=\"input-group-addon btn btn-primary btn-show-options\"\n                data-toggle=\"tooltip\"\n                data-placement=\"bottom\"\n                title=\"Show Options\"\n                ng-click=\"showOptions(\'#country-input\')\">\n                <i class=\"fa fa-chevron-down\"></i>\n              </div>\n              <div\n                class=\"input-group-addon btn btn-danger geodash-clear\"\n                data-toggle=\"tooltip\"\n                data-placement=\"bottom\"\n                title=\"Clear Selection\"\n                data-target-input-id=\"country-input\">\n                <i class=\"fa fa-times\"></i>\n              </div>\n          </div>\n          <div class=\"input-group\">\n            <span class=\"input-group-addon\" id=\"hazard-addon\">Hazard</span>\n            <input\n              id=\"hazard-input\"\n              name=\"hazard-input\"\n              type=\"text\"\n              class=\"typeahead form-control\"\n              style=\"height: auto;\"\n              placeholder=\"Hazard (e.g., Flood, Cyclone, Drought, or Landslide)\"\n              aria-describedby=\"hazard-addon\"\n              data-placeholder=\"Hazard (e.g., Flood, Cyclone, Drought, or Landslide)\"\n              data-typeahead-datasets=\"Hazards\"\n              data-initial-value=\"{{ {\'id\': state.hazard, \'text\': state.hazard_title } | json }}\"\n              data-target-scope-id=\"geodash-sidebar-left\"\n              data-target-scope-path=\"hazard\"\n              data-search-output=\"id\"\n              data-template-empty=\"<div class=&quot;alert alert-danger empty-message&quot;>Unable to find hazard</div>\">\n              <div\n                class=\"input-group-addon btn btn-primary btn-show-options\"\n                data-toggle=\"tooltip\"\n                data-placement=\"bottom\"\n                title=\"Show Options\"\n                ng-click=\"showOptions(\'#hazard-input\')\">\n                <i class=\"fa fa-chevron-down\"></i>\n              </div>\n              <div\n                class=\"input-group-addon btn btn-danger geodash-clear\"\n                data-toggle=\"tooltip\"\n                data-placement=\"bottom\"\n                title=\"Clear Selection\"\n                data-target-input-id=\"hazard-input\">\n                <i class=\"fa fa-times\"></i>\n              </div>\n          </div>\n          <ul class=\"nav nav-justified welcome-go\">\n            <li>\n              <a\n                ng-disabled=\"country == undefined || hazard == undefined || country == \'\' || hazard == \'\' || (country == state.iso3 && hazard == state.hazard)\"\n                ng-class=\"country == undefined || hazard == undefined || country == \'\' || hazard == \'\' || (country == state.iso3 && hazard == state.hazard) ? \'btn btn-default\' : \'btn btn-primary\' \"\n                ng-href=\"{{ country == undefined || hazard == undefined || country == \'\' || hazard == \'\' || (country == state.iso3 && hazard == state.hazard) ? \'#\' : \'/country/\'+country+\'/hazard/\'+hazard +\'/month/1\' }}\">Change</a>\n            </li>\n          </ul>\n        </div>\n        <hr>\n        <div style=\"max-height: calc(100% - 310px);overflow-y:scroll;\">\n          <div ng-class=\"geodash-sidebar-layers-group\">\n            <div class=\"geodash-sidebar-layers-selected\">\n              <h5>Selected Layers</h5>\n              <div\n                ng-repeat=\"layer in visiblefeaturelayers track by $index\"\n                ng-init=\"layerIndex = $index\"\n                ng-if=\"layer.legend!==undefined\"\n                class=\"geodash-sidebar-item noselect\"\n                data-layer=\"{{ layer.id }}\">\n                <div class=\"geodash-sidebar-item-left\">\n                  <div class=\"geodash-sidebar-item-icon geodash-sidebar-item-visibility\">\n                     <a\n                       class=\"geodash-sidebar-item-visibility-button geodash-intent\"\n                       data-intent-name=\"hideLayer\"\n                       data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.id }}&quot;}\"\n                       data-intent-ctrl=\"geodash-sidebar-left\"\n                       data-toggle=\"tooltip\"\n                       data-placement=\"bottom\"\n                       title=\"Click to hide this layer.\">\n                       <i class=\"fa fa-times\"></i>\n                     </a>\n                  </div><!--\n                  --><div class=\"geodash-sidebar-item-icon geodash-sidebar-item-more\">\n                    <a\n                      class=\"geodash-intent\"\n                      data-intent-name=\"showModal\"\n                      data-intent-data=\"{{ html5data(\'showModal\', \'geodash-modal-layer-more\', \'featurelayer\', layer) }}\"\n                      data-intent-ctrl=\"geodash-sidebar-left\"\n                      data-toggle=\"tooltip\"\n                      data-placement=\"bottom\"\n                      title=\"Click to learn more about this layer.\">\n                      <i class=\"fa fa-info-circle\"></i>\n                    </a>\n                  </div>\n                </div><!--\n                --><div class=\"geodash-sidebar-item-right\">\n                  <div\n                    class=\"geodash-sidebar-item-label\"\n                    style=\"width: 100%;\">\n                    <span ng-bind-html=\"layer.legend.label | md2html\"></span>\n                  </div>\n                </div>\n              </div>\n            </div>\n          </div>\n          <div\n            ng-class=\"geodash-sidebar-layers-group\"\n            ng-repeat=\"x in groups track by $index\"\n            ng-init=\"groupIndex = $index\">\n            <div ng-class=\"x.class\">\n              <h5 ng-bind-html=\"x.label\"></h5>\n              <div\n                ng-repeat=\"layer in x.layers track by $index\"\n                ng-init=\"layerIndex = $index\"\n                ng-if=\"layer.legend | ternary_defined : ( layer.id | inArray : state.view.featurelayers | not) : false\"\n                class=\"geodash-sidebar-item noselect\"\n                data-layer=\"{{ layer.id }}\">\n                <div class=\"geodash-sidebar-item-left\">\n                  <div class=\"geodash-sidebar-item-icon geodash-sidebar-item-more\">\n                    <a\n                      class=\"geodash-intent\"\n                      data-intent-name=\"toggleModal\"\n                      data-intent-data=\"{{ html5data(\'toggleModal\', \'geodash-modal-layer-more\', \'featurelayer\', layer) }}\"\n                      data-intent-ctrl=\"geodash-sidebar-left\"\n                      data-toggle=\"tooltip\"\n                      data-placement=\"bottom\"\n                      title=\"Click to learn more about this layer.\">\n                      <i class=\"fa fa-info-circle\"></i>\n                    </a>\n                  </div>\n                </div><!--\n                --><div class=\"geodash-sidebar-item-right\">\n                  <div\n                    class=\"geodash-sidebar-item-label geodash-intent\"\n                    style=\"width: 100%; opacity: 0.6;\"\n                    data-intent-name=\"showLayer\"\n                    data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.id }}&quot;}\"\n                    data-intent-ctrl=\"geodash-sidebar-left\">\n                    <span ng-bind-html=\"layer.legend.label | md2html\"></span>\n                  </div>\n                </div>\n              </div>\n            </div>\n          </div>\n          <div class=\"geodash-sidebar-layers-group geodash-sidebar-baselayers geodash-radio-group\">\n            <h5>Base Layers</h5>\n            <div\n              ng-repeat=\"layer in baselayers track by $index\"\n              ng-init=\"layerIndex = $index\"\n              ng-if=\"layer.legend!==undefined\"\n              class=\"geodash-sidebar-item noselect\"\n              data-layer=\"{{ layer.id }}\">\n              <div class=\"geodash-sidebar-item-left\">\n                <div class=\"geodash-sidebar-item-icon geodash-sidebar-item-more\">\n                  <a\n                    class=\"geodash-intent\"\n                    data-intent-name=\"toggleModal\"\n                    data-intent-data=\"{{ html5data(\'toggleModal\', \'geodash-modal-layer-more\', \'baselayer\', layer) }}\"\n                    data-intent-ctrl=\"geodash-sidebar-left\"\n                    data-toggle=\"tooltip\"\n                    data-placement=\"bottom\"\n                    title=\"Click to learn more about this layer.\">\n                    <i class=\"fa fa-info-circle\"></i>\n                  </a>\n                </div><!--\n                --><div class=\"geodash-sidebar-item-icon geodash-sidebar-item-visibility\">\n                     <a\n                       ng-class=\" layer.id == state.view.baselayer ? \'geodash-sidebar-item-visibility-button geodash-intent geodash-radio geodash-on\' : \'geodash-sidebar-item-visibility-button geodash-intent geodash-radio\'\"\n                       data-intent-name=\"switchBaseLayer\"\n                       data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.id }}&quot;}\"\n                       data-intent-class-on=\"geodash-on\"\n                       data-intent-class-off=\"\"\n                       data-intent-ctrl=\"geodash-sidebar-left\">\n                       <i class=\"fa fa-eye geodash-on\"></i><i class=\"fa fa-eye-slash geodash-off\"></i>\n                     </a>\n                </div><!--\n                --><div class=\"geodash-sidebar-item-symbol\" style=\"width: 10px;\"></div>\n              </div><!--\n              --><div class=\"geodash-sidebar-item-right\">\n                <div\n                  class=\"geodash-sidebar-item-label\"\n                  style=\"{{ layer.id == state.view.baselayer ? \'width: 100%;\' : \'width: 100%;opacity: 0.4;\' }}\">\n                  <span ng-bind-html=\"layer.legend.label | md2html\"></span>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n      <div\n        id=\"geodash-sidebar-left-filters\"\n        role=\"tabpanel\"\n        class=\"geodash-sidebar-pane tab-pane fade\">\n        <div class=\"input-group\">\n          <span class=\"input-group-addon\" id=\"layer-addon\">Layer</span>\n          <input\n            id=\"layer-input\"\n            name=\"layer-input\"\n            type=\"text\"\n            class=\"typeahead form-control\"\n            style=\"height: auto;\"\n            placeholder=\"Layer to Filter\"\n            aria-describedby=\"layer-addon\"\n            data-placeholder=\"Layer to Filter\"\n            data-typeahead-datasets=\"FeatureLayersWithFilters\"\n            data-initial-value=\"{{ {\'id\': \'popatrisk\', \'text\': \'Population at Risk\', \'obj\': $scope.dashboard.featurelayers[0] } | json }}\"\n            data-target-tab-id=\"geodash-sidebar-left-filters-pane-###value###\"\n            data-search-output=\"id\"\n            data-template-empty=\"<div class=&quot;alert alert-danger empty-message&quot;>Unable to find layer</div>\">\n            <div\n              class=\"input-group-addon btn btn-primary btn-show-options\"\n              data-toggle=\"tooltip\"\n              data-placement=\"bottom\"\n              title=\"Show Options\"\n              ng-click=\"showOptions(\'#layer-input\')\">\n              <i class=\"fa fa-chevron-down\"></i>\n            </div>\n            <div\n              class=\"input-group-addon btn btn-danger geodash-clear\"\n              data-toggle=\"tooltip\"\n              data-placement=\"bottom\"\n              title=\"Clear Selection\"\n              data-target-input-id=\"layer-input\">\n              <i class=\"fa fa-times\"></i>\n            </div>\n        </div>\n        <hr>\n        <div class=\"tab-content\">\n          <div\n            ng-repeat=\"layer in featureLayersWithFilters track by $index\"\n            ng-init=\"layerIndex = $index\"\n            id=\"geodash-sidebar-left-filters-pane-{{ layer.id }}\"\n            ng-class=\"layer.id == \'popatrisk\' ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            role=\"tabpanel\"\n            data-layer=\"{{ layer.id }}\">\n            <div\n              class=\"row\"\n              style=\"margin-bottom: 4px;\"\n              ng-repeat=\"filter in layer.filters track by $index\">\n              <div geodash-filter-radio ng-if=\"filter.type == \'radio\'\"></div>\n              <div geodash-filter-checkbox ng-if=\"filter.type == \'checkbox\'\"></div>\n              <div geodash-filter-slider ng-if=\"filter.type == \'slider\'\"></div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n";
geodash.templates.static["modal_filter_more.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Filter / {{ filter.label }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li\n            role=\"presentation\"\n            class=\"active\">\n            <a\n              href=\"#modal-filter-more-general\"\n              aria-controls=\"modal-filter-more-general\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">General</a>\n          </li>\n          <li\n            ng-if=\"filter.type == \'checkbox\' && filter.checkbox.options\"\n            role=\"presentation\"\n            class=\"\">\n            <a\n              href=\"#modal-filter-more-options\"\n              aria-controls=\"modal-filter-more-options\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Options</a>\n          </li>\n          <li\n            ng-if=\"filter.type == \'slider\' && filter.slider.options\"\n            role=\"presentation\"\n            class=\"\">\n            <a\n              href=\"#modal-filter-more-options\"\n              aria-controls=\"modal-filter-more-options\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Options</a>\n          </li>\n        </ul>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-filter-more-general\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"filter.description | md2html | default:\'No description given.\'\"></span>\n            <br><br><b>Type:</b> {{ filter.type }}\n            <div\n              ng-if=\"filter.type ==\'slider\' && filter.slider.type == \'continuous\'\">\n              <b>Minimum Value:</b> <span ng-bind-html=\"filter.slider.min | formatInteger:\'delimited\':\' \'\"></span>\n            </div>\n            <div\n              ng-if=\"filter.type ==\'slider\' && filter.slider.type == \'continuous\'\">\n              <b>Maximum Value:</b> <span ng-bind-html=\"filter.slider.max | formatInteger:\'delimited\':\' \'\"></span>\n            </div>\n            <div\n              ng-if=\"filter.type ==\'slider\' && filter.slider.type == \'ordinal\'\">\n              <b>Minimum Value:</b> <span ng-bind-html=\"filter.slider.options | first\"></span>\n            </div>\n            <div\n              ng-if=\"filter.type ==\'slider\' && filter.slider.type == \'ordinal\'\">\n              <b>Maximum Value:</b> <span ng-bind-html=\"filter.slider.options | last\"></span>\n            </div>\n            <hr>\n            <div\n              ng-if=\"filter.type ==\'slider\' && filter.slider.type == \'ordinal\'\">\n              <b>Current Value:</b> <span ng-bind-html=\"value\"></span>\n            </div>\n            <div\n              ng-if=\"filter.type ==\'slider\' && filter.slider.type == \'continuous\'\">\n              <b>Current Value:</b> <span ng-bind-html=\"value | join:\' - \'\"></span>\n            </div>\n            <div\n              ng-if=\"filter.type ==\'checkbox\'\">\n              <b>Current Value:</b> <span ng-bind-html=\"value | formatArray\"></span>\n            </div>\n          </div>\n          <div\n            ng-if=\"filter.type == \'checkbox\' && filter.checkbox.options\"\n            id=\"modal-filter-more-options\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span\n              ng-repeat-start=\"option in filter.checkbox.options track by $index\">\n              <i ng-class=\"option.checked ? \'fa fa-check-square-o\' : \'fa fa-square-o\'\"></i>\n              <b ng-bind-html=\"option.label\"></b>:\n              <span ng-bind-html=\"option.description | default_if_undefined:\'No description given\'\"></span>\n            </span>\n            <br>\n            <br ng-repeat-end>\n          </div>\n          <div\n            ng-if=\"filter.type == \'slider\' && filter.slider.options\"\n            id=\"modal-filter-more-options\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span\n              ng-repeat-start=\"option in filter.slider.options track by $index\">\n              <i ng-class=\"option.checked ? \'fa fa-check-square-o\' : \'fa fa-square-o\'\"></i>\n              <b ng-bind-html=\"option\"></b>\n            </span>\n            <br ng-repeat-end>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates.static["filter_checkbox.tpl.html"] = "<div\n  class=\"col-md-12 geodash-filter geodash-filter-checkbox\"\n  style=\"min-height: {{ filter.height }};\">\n  <div class=\"geodash-filter-label\">\n    <a\n      class=\"geodash-intent\"\n      data-intent-name=\"toggleModal\"\n      data-intent-data=\"{&quot;id&quot;:&quot;geodash-modal-filter-more&quot;,&quot;static&quot;:{&quot;tab&quot;:&quot;modal-filter-more-general&quot;},&quot;dynamic&quot;:{&quot;value&quot;:[&quot;state&quot;,&quot;filters&quot;,&quot;popatrisk&quot;,&quot;{{ filter.checkbox.output }}&quot;],&quot;filter&quot;:[&quot;map_config&quot;,&quot;featurelayers&quot;,&quot;popatrisk&quot;,&quot;filters&quot;,&quot;{{ $index }}&quot;]}}\"\n      data-intent-ctrl=\"geodash-map-filter\">\n      <i class=\"fa fa-info-circle\"></i>\n    </a>\n    <span ng-bind-html=\"filter.label | md2html\"></span> :\n  </div>\n  <div\n    class=\"btn-group\"\n    style=\"float:left;\"\n    data-toggle=\"buttons\"\n    data-layer=\"{{ filter.layer }}\"\n    data-output=\"{{ filter.checkbox.output }}\">\n    <label\n      ng-repeat=\"opt in filter.checkbox.options track by $index\"\n      ng-class=\"opt.checked ? \'btn btn-sm btn-primary active\' : \'btn btn-sm btn-default\'\">\n      <input\n        type=\"checkbox\"\n        id=\"{{ opt.id }}\"\n        data-value=\"{{ opt.value }}\"\n        autocomplete=\"off\"\n        ng-checked=\"opt.checked || opt.selected\"/>\n      {{ opt.label }}\n    </label>\n  </div>\n</div>\n";
geodash.templates.static["filter_radio.tpl.html"] = "<div\n  class=\"col-md-12 geodash-filter geodash-filter-radio\"\n  style=\"min-height: {{ filter.height }};\">\n  <div class=\"geodash-filter-label\">\n    <a\n      class=\"geodash-intent\"\n      data-intent-name=\"toggleModal\"\n      data-intent-data=\"{&quot;id&quot;:&quot;geodash-modal-filter-more&quot;,&quot;static&quot;:{&quot;tab&quot;:&quot;modal-filter-more-general&quot;},&quot;dynamic&quot;:{&quot;value&quot;:[&quot;state&quot;,&quot;filters&quot;,&quot;popatrisk&quot;,&quot;{{ filter.radio.output }}&quot;],&quot;filter&quot;:[&quot;map_config&quot;,&quot;featurelayers&quot;,&quot;popatrisk&quot;,&quot;filters&quot;,&quot;{{ $index }}&quot;]}}\"\n      data-intent-ctrl=\"geodash-map-filter\">\n      <i class=\"fa fa-info-circle\"></i>\n    </a>\n    <span ng-bind-html=\"filter.label | md2html\"></span> :\n  </div>\n  <div\n    class=\"btn-group\"\n    style=\"float:left;\"\n    data-toggle=\"buttons\"\n    data-layer=\"{{ filter.layer }}\"\n    data-output=\"{{ filter.radio.output }}\">\n    <label\n      ng-repeat=\"opt in filter.radio.options track by $index\"\n      ng-class=\"opt.checked ? \'btn btn-default active\' : \'btn btn-default\'\">\n      <input\n        type=\"radio\"\n        id=\"{{ opt.id }}\"\n        name=\"{{ opt.name }}\"\n        value=\"{{ opt.value }}\"\n        data-output=\"{{ filter.radio.output }}\"\n        ng-checked=\"opt.checked || opt.selected\"/>\n      {{ opt.label }}\n    </label>\n  </div>\n</div>\n";
geodash.templates.static["filter_slider.tpl.html"] = "<div\n  class=\"col-md-12 geodash-filter geodash-filter-slider\"\n  style=\"min-height: {{ filter.height }};\">\n  <div class=\"geodash-filter-label\">\n    <a\n      class=\"geodash-intent\"\n      data-intent-name=\"toggleModal\"\n      data-intent-data=\"{&quot;id&quot;:&quot;geodash-modal-filter-more&quot;,&quot;static&quot;:{&quot;tab&quot;:&quot;modal-filter-more-general&quot;},&quot;dynamic&quot;:{&quot;value&quot;:[&quot;state&quot;,&quot;filters&quot;,&quot;popatrisk&quot;,&quot;{{ filter.slider.output }}&quot;],&quot;filter&quot;:[&quot;map_config&quot;,&quot;featurelayers&quot;,&quot;popatrisk&quot;,&quot;filters&quot;,&quot;{{ $index }}&quot;]}}\"\n      data-intent-ctrl=\"geodash-map-filter\">\n      <i class=\"fa fa-info-circle\"></i>\n    </a>\n    <span ng-bind-html=\"filter.label | md2html\"></span> :\n  </div>\n  <div style=\"display:table; height:{{ filter.height }};padding-left:10px;padding-right:10px;\">\n    <div style=\"display:table-cell;vertical-align:middle;\">\n      <div class=\"geodash-filter-slider-label\">Placeholder</div>\n      <div\n        class=\"geodash-filter-slider-slider\"\n        style=\"width:{{ filter.slider.width }};\"\n        data-layer=\"{{ filter.layer }}\"\n        data-type=\"{{ filter.slider.type }}\"\n        data-value=\"{{ filter.slider.value ? filter.slider.value : \'\' }}\"\n        data-values=\"{{ filter.slider.values ? filter.slider.values : \'\' }}\"\n        data-range=\"{{ filter.slider.range == \'true\' ? \'true\': filter.slider.range }}\"\n        data-output=\"{{ filter.slider.output }}\"\n        data-min-value=\"{{ filter.slider.min|default_if_undefined:\'\' }}\"\n        data-max-value=\"{{ filter.slider.max|default_if_undefined:\'\' }}\"\n        data-step=\"{{ filter.slider.step ? filter.slider.step : \'\' }}\"\n        data-options=\"{{ filter.slider.options ? filter.slider.options : \'\' }}\"\n        data-label-template=\"{{ filter.slider.label }}\"\n        ></div>\n    </div>\n  </div>\n</div>\n";
geodash.templates.static["sparc_modal_welcome.tpl.html"] = "<div\n  id=\"geodash-modal-sparc-welcome\"\n  class=\"geodash-controller geodash-controller-modal geodash-modal modal fade geodash-sparc-welcome\"\n  tabindex=\"-1\"\n  role=\"dialog\"\n  aria-labelledby=\"myModalLabel\">\n  <div class=\"modal-dialog\" data-backdrop=\"static\" role=\"document\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <h4 class=\"modal-title\" id=\"myModalLabel\">{{ dashboard.welcome.title }}</h4>\n      </div>\n      <div class=\"modal-body\">\n        <div>\n          <div geodash-tabs></div>\n          <div class=\"tab-content\">\n            <div\n              id=\"modal-sparc-welcome-intro\"\n              class=\"tab-pane fade in active\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <span\n                class=\"welcome-body\"\n                ng-bind-html=\"dashboard.welcome.intro | md2html | default:\'No body given.\'\"></span>\n              <hr>\n              <h3 class=\"welcome-body\">Get Started: Select a county &amp; hazard!</h3>\n              <div class=\"input-group select2-bootstrap-prepend select2-bootstrap-append\">\n                <span class=\"input-group-addon\" id=\"country-addon\">Country</span>\n                <input\n                  id=\"country-input\"\n                  name=\"country-input\"\n                  type=\"text\"\n                  class=\"typeahead form-control\"\n                  style=\"height: auto;\"\n                  placeholder=\"Country (e.g., Haiti or Philippines)\"\n                  aria-describedby=\"country-addon\"\n                  data-placeholder=\"Country (e.g., Haiti, Nepal, or Philippines)\"\n                  data-typeahead-datasets=\"Countries\"\n                  data-target-scope-id=\"geodash-modal-sparc-welcome\"\n                  data-target-scope-path=\"country\"\n                  data-search-output=\"id\"\n                  data-template-empty=\"<div class=&quot;alert alert-danger empty-message&quot;>Unable to find country</div>\">\n                  <div\n                    class=\"input-group-addon btn btn-primary btn-show-options\"\n                    data-toggle=\"tooltip\"\n                    data-placement=\"bottom\"\n                    title=\"Show Options\"\n                    ng-click=\"showOptions(\'#country-input\')\">\n                    <i class=\"fa fa-chevron-down\"></i>\n                  </div>\n                  <div\n                    class=\"input-group-addon btn btn-danger geodash-clear\"\n                    data-toggle=\"tooltip\"\n                    data-placement=\"bottom\"\n                    title=\"Clear Selection\"\n                    data-target-input-id=\"country-input\">\n                    <i class=\"fa fa-times\"></i>\n                  </div>\n              </div>\n              <div class=\"input-group select2-bootstrap-prepend select2-bootstrap-append\">\n                <span class=\"input-group-addon\" id=\"hazard-addon\">Hazard</span>\n                <input\n                  id=\"hazard-input\"\n                  name=\"hazard-input\"\n                  type=\"text\"\n                  class=\"typeahead form-control\"\n                  style=\"height: auto;\"\n                  placeholder=\"Hazard (e.g., Flood, Cyclone, Drought, or Landslide)\"\n                  aria-describedby=\"hazard-addon\"\n                  data-placeholder=\"Hazard (e.g., Flood, Cyclone, Drought, or Landslide)\"\n                  data-typeahead-datasets=\"Hazards\"\n                  data-target-scope-id=\"geodash-modal-sparc-welcome\"\n                  data-target-scope-path=\"hazard\"\n                  data-search-output=\"id\"\n                  data-template-empty=\"<div class=&quot;empty-message&quot;>Unable to find hazard</div>\">\n                  <div\n                    class=\"input-group-addon btn btn-primary btn-show-options\"\n                    data-toggle=\"tooltip\"\n                    data-placement=\"bottom\"\n                    title=\"Show Options\"\n                    ng-click=\"showOptions(\'#hazard-input\')\">\n                    <i class=\"fa fa-chevron-down\"></i>\n                  </div>\n                  <div\n                    class=\"input-group-addon btn btn-danger geodash-clear\"\n                    data-toggle=\"tooltip\"\n                    data-placement=\"bottom\"\n                    title=\"Clear Selection\"\n                    data-target-input-id=\"hazard-input\">\n                    <i class=\"fa fa-times\"></i>\n                  </div>\n              </div>\n              <hr>\n              <ul class=\"nav nav-justified welcome-go\">\n                <li>\n                  <a\n                    ng-disabled=\"country == undefined || hazard == undefined || country == \'\' || hazard == \'\'\"\n                    ng-class=\"country == undefined || hazard == undefined || country == \'\' || hazard == \'\' ? \'btn btn-default\' : \'btn btn-primary\' \"\n                    ng-href=\"{{ country == undefined || hazard == undefined || country == \'\' || hazard == \'\' ? \'#\' : \'/country/\'+country+\'/hazard/\'+hazard +\'/month/1\' }}\">Go!</a>\n                </li>\n              </ul>\n            </div>\n            <div\n              id=\"modal-sparc-welcome-about\"\n              class=\"tab-pane fade\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <span ng-bind-html=\"dashboard.welcome.about | md2html | default:\'No body given.\'\"></span>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n";
geodash.templates.static["main.tpl.html"] = "<div\n  class=\"row geodash-row geodash-main geodash-dashboard geodash-controller\">\n  <div\n    id=\"geodash-map\"\n    class=\"row geodash-row geodash-map geodash-controller\"\n    geodash-base>\n    <div data-geodash-controllers=\"GeoDashControllerOverlays\" geodash-map-overlays></div>\n    <div data-geodash-controllers=\"GeoDashControllerLegend\" geodash-map-legend></div>\n    <div id=\"map\" data-geodash-controllers=\"GeoDashControllerMapMap\" geodash-map-map></div>\n    <div id=\"geodash-popups\" style=\"display:none;\">\n      <div id=\"popup\"></div>\n    </div>\n  </div>\n  <div id=\"geodash-modals\"></div>\n</div>\n";

var MONTHS_NUM = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
//Array(12).fill().map((x,i)=>i)

var MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"];

var MONTHS_SHORT3 =
[
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec"];

var MONTHS_ALL = $.map(MONTHS_NUM, function(num, i){
  return {
    'num': num,
    'short3': MONTHS_SHORT3[i],
    'long': MONTHS_LONG[i]
  };
});

var DAYSOFTHEWEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'];

geodash.filters["default"] = function()
{
  return function(value, fallback)
  {
    return value || fallback;
  };
};

geodash.filters["md2html"] = function()
{
  return function(text)
  {
    if(text != undefined)
    {
      var converter = new showdown.Converter();
      html = converter.makeHtml(text);

      // Open Links in New Windows
      html = html.replace(new RegExp("(<a .*?)>(.*?)</a>", "gi"), '$1 target="_blank">$2</a>');

      // Replace New Line characters with Line Breaks
      html = html.replace(new RegExp('\n', 'gi'),'<br>');

      // Replace extra new lines before heading tags, which add their own margin by default
      html = html.replace(new RegExp("<br><br><(h\\d.*?)>", "gi"),'<br><$1>');

      // Replace extra new lines before paragraph tags, which add their own margin by default
      html = html.replace(new RegExp("<br><br><p>", "gi"),'<p>');

      // If one enclosing paragraph element, then flatten it.
      var matches = html.match(new RegExp("^<p(.*?)>(.*?)</p>", "gi"));
      if(Array.isArray(matches) && matches.length == 1)  // If only 1 match
      {
        if(matches[0] == html) // Fully enclosing
        {
          html = html.substring("<p>".length, html.length - "</p>".length);
        }
      }

      return html;
    }
    else
    {
      return "";
    }
  };
};

geodash.filters["percent"] = function()
{
  return function(value, denominator)
  {
    return 100.0 * value / denominator;
  };
};

geodash.filters["tabLabel"] = function()
{
  return function(value)
  {
    return value.split(" ").length == 2 ? value.replace(' ', '<br>') : value;
  };
};

geodash.filters["as_float"] = function()
{
  return function(value)
  {
    return 1.0 * value;
  };
};

geodash.filters["add"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(arg))
    {
      var arr = arg;
      return value + arr[value % arr.length];
    }
    else if(arguments.length > 2)
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return value + arr[value % arr.length];
    }
    else
    {
      return value + arg;
    }
  };
};

geodash.filters["title"] = function()
{
  return function(value)
  {
    return $.type(value) === "string" ? value.toTitleCase() : value;
  };
};

geodash.filters["as_array"] = function()
{
  return function(value)
  {
    if($.isArray(value))
    {
      return value;
    }
    else
    {
      return $.map(value, function(item, key){
        return {'key': key, 'item': item};
      });
    }
  };
};

geodash.filters["sortItemsByArray"] = function()
{
  return function(value, arg)
  {
    if($.isArray(value))
    {
      value = $.grep(value,function(x, i){
        return $.inArray(x["key"], arg) != -1;
      });
      value.sort(function(a, b){
        return $.inArray(a["key"], arg) - $.inArray(a["key"], arg);
      });
      return value;
    }
    else
    {
      return value;
    }
  };
};

geodash.filters["breakpoint"] = function()
{
    return function(style, index)
    {
      var breakpoints = geodash.breakpoints[style.styles.default.dynamic.options.breakpoints];
      if(breakpoints != undefined && breakpoints.length > 0)
      {
        return breakpoints[index];
      }
      else
      {
        return -1;
      }
    };
};

geodash.filters["breakpoints"] = function()
{
    return function(style)
    {
      var breakpoints = geodash.breakpoints[style.styles.default.dynamic.options.breakpoints];
      if(breakpoints != undefined && breakpoints.length > 0)
      {
        return breakpoints;
      }
      else
      {
        return [];
      }
    };
};

geodash.filters["position_x"] = function()
{
    return function(domain, index, containerWidth, padding)
    {
      var parse_container_width = function(w)
      {
        return $.isNumeric(w) ? w : parseInt(w.substring(0, w.indexOf('px')), 10);
      };
      var actualWidth = parse_container_width(containerWidth) - (padding * 2);
      return padding + (actualWidth * index / domain);
    };
};

geodash.filters["width_x"] = function()
{
    return function(domain, containerWidth, padding)
    {
      var parse_container_width = function(w)
      {
        return $.isNumeric(w) ? w : parseInt(w.substring(0, w.indexOf('px')), 10);
      };
      var actualWidth = parse_container_width(containerWidth)  - (padding * 2);
      return actualWidth / domain;
    };
};

geodash.filters["len"] = geodash.filters["length"] = function()
{
  return function(value)
  {
    if(Array.isArray(value))
    {
      return value.length;
    }
    else if(angular.isString(value))
    {
      return value.length;
    }
    else
    {
      return 0;
    }
  };
};

geodash.filters["layer_is_visible"] = function()
{
  return function(layerID, state)
  {
    state = state || $("#geodash-main").scope().state;
    var visibleFeatureLayers = state.view.featurelayers;
    return (layerID == state.view.baselayer) || $.inArray(layerID, visibleFeatureLayers) != -1;
  };
};

geodash.filters["append"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(value))
    {
      if(Array.isArray(arg))
      {
        return value.concat(arg);
      }
      else
      {
        return value.push(arg);
      }
    }
    else if(angular.isString(value))
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return value + arr.join("");
    }
    else
    {
      return value + arg;
    }
  };
};

geodash.filters["default_if_undefined"] = function()
{
  return function(value, fallback)
  {
    if(value != undefined && value != null)
    {
      return value;
    }
    else
    {
      return fallback;
    }
  };
};

geodash.filters["default_if_undefined_or_blank"] = function()
{
  return function(value, fallback)
  {
    if(value != undefined && value != null && value != "")
    {
      return value;
    }
    else
    {
      return fallback;
    }
  };
};

geodash.filters["extract"] = function()
{
  return function(node)
  {
    var keyChain = Array.prototype.slice.call(arguments, [1]);
    if(keyChain.length > 0)
    {
      return extract(expand(keyChain), node);
    }
    else
    {
      return null;
    }
  };
};

geodash.filters["extractTest"] = function()
{
  return function(node)
  {
    var keyChain = Array.prototype.slice.call(arguments, [1]);
    if(keyChain.length > 0)
    {
      return extract(expand(keyChain), node);
    }
    else
    {
      return null;
    }
  };
};

geodash.filters["inArray"] = function()
{
  return function(value, arr)
  {
      if(Array.isArray(arr))
      {
        return arr.indexOf(value) != -1;
      }
      else
      {
        return false;
      }
  };
};

geodash.filters["not"] = function()
{
  return function(value)
  {
    return ! value;
  };
};

geodash.filters["prepend"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(value))
    {
      if(Array.isArray(arg))
      {
        return arg.concat(value);
      }
      else
      {
        return [arg].concat(value);
      }
    }
    else if(angular.isString(value))
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return arr.join("") + value;
    }
    else
    {
      return arg + value;
    }
  };
};

geodash.filters["parseTrue"] = function()
{
  return function(value)
  {
      return ['on', 'true', 't', '1', 1, true].indexOf(value) != -1;
  };
};

geodash.filters["ternary"] = function()
{
  return function(value, t, f)
  {
    return value ? t : f;
  };
};

geodash.filters["ternary_defined"] = function()
{
  return function(value, t, f)
  {
    if(value != undefined && value != null && value != "")
    {
      return t;
    }
    else
    {
      return f;
    }
  };
};

geodash.filters["yaml"] = function()
{
  return function(value, depth)
  {
    if(value != undefined)
    {
      return YAML.stringify(value, (depth || 4));
    }
    else
    {
      return "";
    }
  };
};

geodash.filters["arrayToObject"] = function()
{
  return function(x)
  {
    var y = {};
    if(angular.isArray(x))
    {
      for(var i = 0; i < x.length; i++)
      {
        y[x[i].name] = x[i].value;
      }
    }
    return y;
  };
};

geodash.filters["join"] = function()
{
    return function(array, arg)
    {
        if(Array.isArray(array))
        {
            return array.join(arg);
        }
        else
        {
            return array;
        }
    };
};

geodash.filters["first"] = function()
{
    return function(array)
    {
        if (!Array.isArray(array))
        {
            return array;
        }
        return array[0];
    };
};

geodash.filters["last"] = function()
{
    return function(arr)
    {
        if (!Array.isArray(arr))
        {
            return arr;
        }

        if(arr.length == 0)
        {
            return undefined;
        }

        return arr[arr.length - 1];
    };
};

geodash.filters["choose"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(arg))
    {
      var arr = arg;
      return arr[value % arr.length];
    }
    else
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return arr[value % arr.length];
    }
  };
};

geodash.filters["css"] = function()
{
  return function(styleMap) { return geodash.codec.formatCSS(styleMap); };
};

geodash.filters["ellipsis"] = function()
{
  return function(styleMap) {
    styleMap = styleMap || {};
    angular.extend(styleMap, geodash.ui.css.ellipsis());
    return styleMap;
  };
};

geodash.filters["formatBreakpoint"] = function()
{
    return function(value)
    {
      if(Number.isInteger(value))
      {
        return geodash.filters["formatInteger"]()(value, 'delimited', ' ');
      }
      else if($.isNumeric(value))
      {
        return geodash.filters["formatFloat"]()(value, 2);
      }
      else
      {
        return "" + value;
      }
    };
};

geodash.filters["formatFloat"] = function()
{
  return function(value, decimals)
  {
    if(value != undefined && value !== "")
    {
      if(decimals != undefined)
      {
        return value.toFixed(decimals);
      }
      else
      {
        return value.toString();
      }
    }
    else
    {
      return "";
    }
  };
};

geodash.filters["formatInteger"] = function()
{
  return function(value, type, delimiter)
  {
    if(value != undefined && value !== "")
    {
      if(type == "delimited")
      {
        delimiter = delimiter || ',';
        var str = Math.round(value).toString(); // Round in case value is a float
        var pattern = new RegExp('(\\d+)(\\d{3})','gi');
        while(pattern.test(str)){str=str.replace(pattern,'$1'+ delimiter +'$2');}
        return str;
      }
      else
      {
        return Math.round(value).toString();
      }
    }
    else
    {
        return "";
    }
  };
};

geodash.filters["formatArray"] = function()
{
  return function(arr)
  {
      if(Array.isArray(arr))
      {
        if(arr.length == 0)
        {
          return "";
        }
        else if(arr.length == 1)
        {
          return arr[0];
        }
        else if(arr.length == 2)
        {
          return arr.join(" and ");
        }
        else // greater than 2
        {
          return arr.slice(0,-1).join(", ")+", and "+arr[arr.length - 1];
        }
      }
      else
      {
          return arr;
      }
  };
};

geodash.filters["formatMonth"] = function()
{
  return function(value, type)
  {
    if(value != undefined && value !== "")
    {
      if(type == "long")
      {
        return months_long[value-1];
      }
      else if(type == "short3" || type == "short_3")
      {
        return months_short_3[value-1];
      }
      else if(type == "int2")
      {
        return value < 10 ? ('0'+ value.toString()) : value.toString();
      }
      else
      {
        return value.toString();
      }
    }
    else
    {
      return ""
    }
  };
};

geodash.filters["eq"] = function()
{
  return function(value, arg)
  {
    if(angular.isNumber(value) && angular.isNumber(arg))
    {
      return value == arg;
    }
    else
    {
      return false;
    }
  };
};

geodash.filters["lte"] = function()
{
  return function(value, arg)
  {
    if(angular.isNumber(value) && angular.isNumber(arg))
    {
      return value <= arg;
    }
    else
    {
      return false;
    }
  };
};

geodash.filters["gte"] = function()
{
  return function(value, arg)
  {
    if(angular.isNumber(value) && angular.isNumber(arg))
    {
      return value >= arg;
    }
    else
    {
      return false;
    }
  };
};

geodash.filters["gt"] = function()
{
  return function(value, arg)
  {
    if(angular.isNumber(value) && angular.isNumber(arg))
    {
      return value > arg;
    }
    else
    {
      return false;
    }
  };
};

geodash.filters["replace"] = function()
{
  return function(value, oldSubstring, newSubstring)
  {
      if(angular.isString(value))
      {
        if(angular.isString(oldSubstring) && angular.isString(newSubstring))
        {
          if(oldSubstring == ".")
          {
            return value.replace(new RegExp('[.]', 'g'), newSubstring);
          }
          else
          {
            return value.replace(oldSubstring, newSubstring);
          }
        }
        else
        {
          return value;
        }
      }
      else
      {
        return "";
      }
  };
};

geodash.filters["split"] = function()
{
    return function(value, delimiter)
    {
        if(angular.isString(value))
        {
            return value.split(delimiter || ",");
        }
        else
        {
            return value;
        }
    };
};

geodash.filters["stringToObject"] = function()
{
  return function(x, properties)
  {
    var y = {};
    if(Array.isArray(properties))
    {
      for(var i = 0; i < properties.length; i++)
      {
        y[properties[i]] = x;
      }
    }
    return y;
  };
};

geodash.filters["url_shapefile"] = function()
{
    return function(layer, state)
    {
        var url = "";
        if("wfs" in layer)
        {
          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers[0];
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers[0];
          }
          var params = {
            "format_options": "charset:UTF-8",
            "typename": typename,
            "outputFormat": "SHAPE-ZIP",
            "version": "1.0.0",
            "service": "WFS",
            "request": "GetFeature"
          };
          if(state != undefined)
          {
            params["cql_filter"] = "BBOX("+layer.wfs.geometry+", "+state.view.extent+")";
          }
          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.wfs.url + "?" + querystring;
        }
        return url;
    };
};

geodash.filters["url_geojson"] = function()
{
    return function(layer, state)
    {
        var url = "";
        if("wfs" in layer)
        {
          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers[0];
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers[0];
          }
          var params = {
            "format_options": "charset:UTF-8",
            "typename": typename,
            "outputFormat": "json",
            "version": "1.0.0",
            "service": "WFS",
            "request": "GetFeature"
          };
          if(state != undefined)
          {
            params["cql_filter"] = "BBOX("+layer.wfs.geometry+", "+state.view.extent+")";
          }
          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.wfs.url + "?" + querystring;
        }
        return url;
    };
};

geodash.filters["url_kml"] = function()
{
    return function(layer, state)
    {
        var url = "";
        if("kml" in layer)
        {
          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers[0];
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers[0];
          }
          var params = {
            "mode": "download",
            "layers": typename
          };
          if(state != undefined)
          {
            params["cql_filter"] = "BBOX("+layer.wfs.geometry+", "+state.view.extent+")";
          }
          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.kml.url + "?" + querystring;
        }
        return url;
    };
};

geodash.filters["url_describefeaturetype"] = function()
{
    return function(layer)
    {
        var url = "";
        if("wfs" in layer)
        {
          var version = layer.wfs.version || "1.0.0";
          var params = {
            "service": "WFS",
            "request": "DescribeFeatureType",
            "version": version,
            "outputFormat": "application/json"
          };

          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers.unique().join(",");
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers.unique().join(",");
          }
          if(version == "1.1.0" || version == "1.0.0")
          {
            params["typeName"] = typename;
          }
          else
          {
            params["typeNames"] = typename;
          }

          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.wfs.url + "?" + querystring;
        }
        return url;
    };
};

geodash.handlers["clickedOnMap"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  //
  var $scope = geodash.util.getScope("geodash-main");
  var map = geodash.var.map;
  var z = $scope.state.view.z;
  var visibleFeatureLayers = $scope.state.view.featurelayers;
  console.log("visibleFeatureLayers", visibleFeatureLayers);
  var featurelayers_geojson = [];
  var featurelayers_by_featuretype = {};
  var fields_by_featuretype = {};
  var urls = [];
  for(var i = 0; i < visibleFeatureLayers.length; i++)
  {
    var fl = geodash.api.getFeatureLayer(visibleFeatureLayers[i], {"scope": $scope});
    if(angular.isDefined(extract("popup.panes", fl)))
    {
      if(fl.type == "geojson")
      {
        featurelayers_geojson.push(fl.id);
      }
      else if(angular.isDefined(extract("wfs", fl)))
      {
        var params = {
          service: "wfs",
          version: extract("wfs.version", fl, '1.0.0'),
          request: "GetFeature",
          srsName: "EPSG:4326",
        };

        //var targetLocation = new L.LatLng(args.lat, args.lon);
        var targetLocation = geodash.normalize.point(args);
        var bbox = geodash.tilemath.point_to_bbox(args.location.lon, args.location.lat, z, 4).join(",");
        var typeNames = extract('wfs.layers', fl, undefined) || extract('wms.layers', fl, undefined) || [] ;
        if(angular.isString(typeNames))
        {
          typeNames = typeNames.split(",");
        }
        for(var j = 0; j < typeNames.length; j++)
        {
          typeName = typeNames[j];
          var url = fl.wfs.url + "?" + $.param($.extend(params, {typeNames: typeName, bbox: bbox}));
          urls.push(url);
          fields_by_featuretype[typeName.toLowerCase()] = geodash.layers.aggregate_fields(fl);
          featurelayers_by_featuretype[typeName.toLowerCase()] = fl;
          if(!typeName.toLowerCase().startsWith("geonode:"))
          {
            featurelayers_by_featuretype["geonode:"+typeName.toLowerCase()] = fl;
          }
        }
      }
    }
  }

  var featureAndLocation = undefined;
  if(featurelayers_geojson.length > 0)
  {
    featureAndLocation = map.forEachFeatureAtPixel(
      [args.pixel.x, args.pixel.y],
      function(feature, layer){
        return {
          'layer': layer.get('id'),
          'feature': geodash.normalize.feature(feature),
          'location': geodash.normalize.point(ol.proj.toLonLat(map.getCoordinateFromPixel([args.pixel.x, args.pixel.y]), map.getView().getProjection()))
        };
      },
      null,
      function(layer) {
        return $.inArray(layer.get('id'), featurelayers_geojson) != -1;
      }
    );
  }

  if(angular.isDefined(featureAndLocation))
  {
    $scope.$broadcast("openPopup", {
      'featureLayer': geodash.api.getFeatureLayer(featureAndLocation.layer),
      'feature': featureAndLocation.feature,
      'location': featureAndLocation.location
    });
  }
  else
  {
    if(urls.length > 0)
    {
      $q.all(geodash.http.build_promises($http, urls)).then(function(responses){
        var features = geodash.http.build_features(responses, fields_by_featuretype);
        console.log("Features: ", features);
        if(features.length > 0 )
        {
          var featureAndLocation = geodash.vecmath.getClosestFeatureAndLocation(features, targetLocation);
          var fl = featurelayers_by_featuretype[featureAndLocation.feature.featuretype] || featurelayers_by_featuretype["geonode:"+featureAndLocation.feature.featuretype];
          $scope.$broadcast("openPopup", {
            'featureLayer': fl,
            'feature': featureAndLocation.feature,
            'location': geodash.normalize.point(featureAndLocation.location)
          });
        }
        else
        {
          $("#popup").popover('destroy');
        }
      });
    }
    else
    {
      $("#popup").popover('destroy');
    }
  }
};

geodash.handlers["filterChanged"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  $scope.$apply(function () {
    $scope.state.filters[args["layer"]] = $.extend(
      $scope.state.filters[args["layer"]],
      args["filter"]);
    var url = buildPageURL($interpolate, $scope.dashboard, $scope.state);
    if(url != undefined)
    {
      history.replaceState($scope.state, "", url);
    }
    $scope.refreshMap($scope.state);
  });
};

geodash.handlers["hideLayer"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.util.getScope("geodash-main");
    var layer = args.layer;
    var i = $.inArray(layer, $scope.state.view.featurelayers);
    if(i != -1)
    {
      $scope.state.view.featurelayers.splice(i, 1);
      $scope.refreshMap($scope.state);
    }
};

geodash.handlers["hideLayers"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.util.getScope("geodash-main");
    var layers = args.layers;
    for(var i = 0; i < layers.length; i++)
    {
      var layer = args.layers[i];
      var j = $.inArray(layer, $scope.state.view.featurelayers);
      if(j != -1)
      {
        $scope.state.view.featurelayers.splice(j, 1);
        $scope.refreshMap($scope.state);
      }
    }
};

geodash.handlers["layerLoaded"] = function($scope, $interpolate, $http, $q, event, args) {
    var $scope = geodash.util.getScope("geodash-main");
    var type = args.type;
    var layer = args.layer;
    var visible = args.visible != undefined ? args.visible : true;
    // $scope.state.view.featurelayers is hardcoded on load now
    /*if(type == "featurelayer")
    {
      if(visible)
      {
        $scope.state.view.featurelayers.push(layer);
      }
    }
    else if(type == "baselayer")
    {
      $scope.state.view.baselayer = layer;
    }*/
};

geodash.handlers["requestToggleComponent"] = function($scope, $interpolate, $http, $q, event, args) {
  geodash.util.getScope("geodash-main").$broadcast("toggleComponent", args);
};

geodash.handlers["selectStyle"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    $scope.$apply(function () {
        $scope.state.styles[args["layer"]] = args["style"];
        var url = buildPageURL($interpolate, $scope.dashboard, $scope.state);
        if(url != undefined)
        {
          history.replaceState($scope.state, "", url);
        }
        $scope.refreshMap($scope.state);
    });
};

geodash.handlers["showLayer"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.util.getScope("geodash-main");
    var layer = args.layer;
    if($.inArray(layer, $scope.state.view.featurelayers) == -1)
    {
      $scope.state.view.featurelayers.push(layer);
      $scope.refreshMap($scope.state);
    }
};

geodash.handlers["showLayers"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.util.getScope("geodash-main");
    var layers = args.layers;
    for(var i = 0; i < layers.length; i++)
    {
      var layer = layers[i];
      if($.inArray(layer, $scope.state.view.featurelayers) == -1)
      {
        $scope.state.view.featurelayers.push(layer);
        $scope.refreshMap($scope.state);
      }
    }
};

geodash.handlers["stateChanged"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  $scope.$apply(function () {
    $scope.state = $.extend($scope.state, args);
    var url = buildPageURL($interpolate, $scope.dashboard, $scope.state);
    if(url != undefined)
    {
      history.replaceState($scope.state, "", url);
    }
    $scope.refreshMap($scope.state);
  });
};

geodash.handlers["switchBaseLayer"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.util.getScope("geodash-main");
    $scope.state.view.baselayer = args.layer;
    $scope.refreshMap($scope.state);
};

geodash.handlers["toggleComponent"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  //
  var component = args.component;
  var position = args.position;
  var classes = component+"-open "+component+"-"+position+"-open";
  $(args.selector).toggleClass(classes);
  setTimeout(function(){

    if(geodash.mapping_library == "ol3")
    {
      setTimeout(function(){

        var m = geodash.var.map;
        m.renderer_.dispose();
        m.renderer_ = new ol.renderer.canvas.Map(m.viewport_, m);
        m.updateSize();
        m.renderSync();

      }, 0);
    }
    else if(geodash.mapping_library == "leaflet")
    {
      setTimeout(function(){ geodash.var.map._onResize(); }, 0);
    }

  },2000);
};

geodash.handlers["viewChanged"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  $scope.state.view = $.extend($scope.state.view, args);
  var url = buildPageURL($interpolate, $scope.dashboard, $scope.state);
  if(url != undefined)
  {
    history.replaceState($scope.state, "", url);
  }
};

geodash.handlers.zoomIn = function($scope, $interpolate, $http, $q, event, args)
{
  var z = geodash.var.map.getView().getZoom();
  var maxZoom = extract("dashboard.view.maxZoom", $scope, 18);
  var newZoom = Math.min(z+1, maxZoom);
  $scope.$broadcast("changeView", { 'zoom': newZoom });
};

geodash.handlers.zoomOut = function($scope, $interpolate, $http, $q, event, args)
{
  var z = geodash.var.map.getView().getZoom();
  var minZoom = extract("dashboard.view.minZoom", $scope, 0);
  var newZoom = Math.max(z-1, minZoom);
  $scope.$broadcast("changeView", { 'zoom': newZoom });
};

geodash.handlers["zoomToLayer"] = function($scope, $interpolate, $http, $q, event, args) {
    var $scope = geodash.util.getScope("geodash-main");
    var layer = args.layer;
    var i = $.inArray(layer, $scope.state.view.featurelayers);
    if(i != -1)
    {
      $scope.$broadcast("changeView", {'layer': layer});
    }
};

geodash.handlers.printMap = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.util.getScope("geodash-main");
    var data = geodash.var.map.getRenderer().canvas_.toDataURL("image/png")
    //window.open(data);
    var newWindow = window.open("", "_blank", "");
    var html = "<a href=\""+data+"\" download=\"sparc.png\"><img src=\""+data+"\"></a>";
    newWindow.document.write(html);
};

geodash.handlers.toggleFullScreen = function($scope, $interpolate, $http, $q, event, args)
{
    if(ol.control.FullScreen.isFullScreenSupported())
    {
      if(ol.control.FullScreen.isFullScreen())
      {
        ol.control.FullScreen.exitFullScreen();
      }
      else
      {
        var target = angular.isDefined(args.element) ?
          $(args.element).parents(".geodash-map:first") :
          $(".geodash-map");
        if(target.length > 0)
        {
          ol.control.FullScreen.requestFullScreenWithKeys(target[0]);
        }
      }
    }
};

geodash.directives.geodashBase = function(){
  return {
    controller: geodash.controllers.GeoDashControllerBase,
    restrict: 'EA',
    replace: false,
    transclude: true,
    scope: true,
    template: "<div ng-transclude></div>",
    link: function ($scope, element, attrs, controllers){}
  };
};

geodash.directives["ngX"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngX, function(value) {
        $element.attr('x', value);
      });
    }
  };
};
geodash.directives["ngY"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngY, function(value) {
        $element.attr('y', value);
      });
    }
  };
};
geodash.directives["ngWidth"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngWidth, function(value) {
        $element.attr('width', value);
      });
    }
  };
};
geodash.directives["ngR"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngR, function(value) {
        $element.attr('r', value);
      });
    }
  };
};
geodash.directives["ngFill"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngFill, function(value) {
        $element.attr('fill', value);
      });
    }
  };
};

geodash.directives["onLinkDone"] = function(){
  return {
    restriction: 'A',
    link: function($scope, element, attributes ) {
      $scope.$emit(attributes["onLinkDone"] || "link_done", {
        'element': element,
        'attributes': attributes
      });
    }
  };
};

geodash.directives["onRepeatDone"] = function(){
  return {
    restriction: 'A',
    link: function($scope, element, attributes ) {
      $scope.$emit(attributes["onRepeatDone"] || "repeat_done", {
        'element': element,
        'attributes': attributes
      });
    }
  };
};

geodash.directives["geodashBtnClose"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'dismiss': '@target'
    },
    templateUrl: 'geodash_btn_close.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashBtnInfo"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'placement': '@placement',
      'info': '@info'
    },
    templateUrl: 'geodash_btn_info.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashBtn"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'mode': '@mode',
      'target': '@target',
      'info': '@info',
      'placement': '@tooltipPlacement'
    },
    templateUrl: 'geodash_btn.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashLabel"]= function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'target': '@target',
      'content': '@content'
    },
    templateUrl: 'geodash_label.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashTab"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'target': '@target',
      'label': '@label',
      'active': '@active',
      'height': '@height'
    },  // Inherit exact scope from parent controller
    templateUrl: 'geodash_tab.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashTabs"]= function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,
    templateUrl: 'geodash_tabs.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives.geodashMapLegend = function(){
  return {
    controller: geodash.controllers.GeoDashControllerLegend,
    restrict: 'EA',
    replace: true,
    scope: {},
    templateUrl: 'map_legend.tpl.html',
    link: function ($scope, element, attrs, controllers)
    {
      setTimeout(function(){ geodash.ui.update(element); }, 0);
    }
  };
};

geodash.directives["geodashModalWelcome"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_welcome.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashModalAbout"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_about.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashModalDownload"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_download.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives.geodashMapOverlays = function(){
  return {
    controller: geodash.controllers.GeoDashControllerOverlays,
    restrict: 'EA',
    replace: true,
    scope: {
      'editable': '@editable'
    },
    templateUrl: 'map_overlays.tpl.html',
    link: function ($scope, element, attrs, controllers)
    {
      if(geodash.util.parseTrue($scope.editable))
      {
        $(element).on('mouseenter', '.geodash-map-overlay', function(event, args){
          $(this).draggable('enable');
          $('.geodash-map-grid').addClass('on');
        });

        $(element).on('mouseleave', '.geodash-map-overlay', function(event, args){
          $(this).draggable('disable');
          $('.geodash-map-grid').removeClass('on');
        });

        $scope.$on("overlayLoaded", function(event, args) {

          console.log("overlayLoaded", event, args);
          var overlayType = args.attributes.overlayType;
          var overlayElement = $(args.element);

          var container = overlayElement.parents(".geodash-map:first");

          if(overlayType == "text")
          {
            /*overlayElement.resizable({
              "containment": container,
              "helper": "ui-resizable-helper"
            });*/
          }
          else if(overlayType == "image")
          {
            //See: http://stackoverflow.com/questions/10703450/draggable-and-resizable-in-jqueryui-for-an-image-is-not-working
            /*$("img", overlayElement).resizable({
              "containment": container,
              "helper": "ui-resizable-helper"
            });*/
          }

          overlayElement.draggable({
            "containment": container,
            start: function(event, args) {
              // http://www.w3schools.com/cssref/pr_class_cursor.asp
              $(this).css('cursor', '-webkit-grabbing');
            },
            drag: function(event, args) {

            },
            stop: function(event, args) {
              // http://www.w3schools.com/cssref/pr_class_cursor.asp
              $(this).css('cursor', 'pointer');
              console.log(event, args);
              var newPosition = args.position;
              var overlayIndex = $(this).data('overlay-index');
              var scope = geodash.util.getScope("geodash-sidebar-right");
              if(scope != undefined)
              {
                var mapWidth = container.width();
                var mapHeight = container.height();

                scope.map_config_flat["overlays__"+overlayIndex+"__position__top"] = newPosition.top < (mapHeight / 2.0) ? newPosition.top+'px' : 'auto';
                scope.map_config_flat["overlays__"+overlayIndex+"__position__bottom"] = newPosition.top >= (mapHeight / 2.0) ? (mapHeight - newPosition.top)+'px' : 'auto';
                scope.map_config_flat["overlays__"+overlayIndex+"__position__left"] = newPosition.left < (mapWidth / 2.0) ? newPosition.left+'px' : 'auto';
                scope.map_config_flat["overlays__"+overlayIndex+"__position__right"] = newPosition.left >= (mapWidth / 2.0) ? (mapWidth - newPosition.left)+'px' : 'auto';

                setTimeout(function(){
                  scope.validateFields([
                    "overlays__"+overlayIndex+"__position__top",
                    "overlays__"+overlayIndex+"__position__bottom",
                    "overlays__"+overlayIndex+"__position__left",
                    "overlays__"+overlayIndex+"__position__right"
                  ])
                }, 0);
              }
            }
          });
        });
      }
    }
  };
};

geodash.directives["geodashSidebarToggleLeft"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      "selector": "@selector"
    },
    templateUrl: 'geodash_sidebar_toggle_left.tpl.html',
    link: function ($scope, $element, attrs){
      setTimeout(function(){

        $('[data-toggle="tooltip"]', $element).tooltip();

      },10);
    }
  };
};

geodash.directives["geodashSidebarToggleRight"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      "selector": "@selector"
    },
    templateUrl: 'geodash_sidebar_toggle_right.tpl.html',
    link: function ($scope, $element, attrs){
      setTimeout(function(){

        $('[data-toggle="tooltip"]', $element).tooltip();

      },10);
    }
  };
};

geodash.directives["sparcCalendar"] = function(){
  return {
    controller: geodash.controllers.SPARCControllerCalendar,
    restrict: 'EA',
    replace: true,
    scope: {},  // Inherit exact scope from parent controller
    templateUrl: 'sparc_calendar.tpl.html',
    link: function ($scope, element, attrs, controllers)
    {
      setTimeout(function(){ geodash.ui.update(element); }, 0);
    }
  };
};

geodash.directives.geodashMapMap = function(){
  return {
    controller: geodash.controllers.GeoDashControllerMapMap,
    restrict: 'EA',
    replace: true,
    scope: {},
    templateUrl: 'map_map.tpl.html',
    link: function ($scope, element, attrs, controllers)
    {
      var dashboard = $scope.dashboard;
      var state = $scope.state;
      //
      var listeners =
      {
        singleclick: function(e) {
          var m = geodash.var.map;
          var v = m.getView();
          var c = ol.proj.toLonLat(e.coordinate, v.getProjection());
          var delta = {
            "location": {
              "lat": c[1],
              "lon": c[0]
            },
            "pixel": {
              "x": e.pixel[0],
              "y": e.pixel[1]
            }
          };
          geodash.api.intend("clickedOnMap", delta, $scope);
          if(geodash.mapping_library == "ol3")
          {
            //$("#popup").popover('destroy');
          }
        },
        zoomend: function(e){
          var m = geodash.var.map;
          var v = m.getView();
          var c = v.getCenter();
          var delta = {
            "extent": v.calculateExtent(m.getSize()).join(","),
            "z": v.getZoom()
          };
          geodash.api.intend("viewChanged", delta, $scope);
          if(geodash.mapping_library == "ol3")
          {
            $("#popup").popover('destroy');
          }
        },
        dragend: function(e){
          var m = geodash.var.map;
          var v = m.getView();
          var c = v.getCenter();
          var delta = {
            "extent": v.calculateExtent(m.getSize()).join(","),
            "location": {
              "lat": c[1],
              "lon": c[0]
            }
          };
          geodash.api.intend("viewChanged", delta, $scope);
        },
        moveend: function(e){
          var m = geodash.var.map;
          var v = m.getView();
          var c = v.getCenter();
          var delta = {
            "extent": v.calculateExtent(m.getSize()).join(","),
            "location": {
              "lat": c[1],
              "lon": c[0]
            },
          };
          geodash.api.intend("viewChanged", delta, $scope);
        }
      };

      var hasViewOverride = geodash.util.hasHashValue(["latitude", "lat", "longitude", "lon", "lng", "zoom", "z"]);
      //var view = state["view"];
      geodash.var.map = geodash.init.map_ol3({
        "id": element.attr("id"),
        "attributionControl": extract(expand("controls.attribution"), dashboard, true),
        "zoomControl": extract(expand("controls.zoom"), dashboard, true),
        "minZoom": extract(expand("view.minZoom"), dashboard, 0),
        "maxZoom": extract(expand("view.maxZoom"), dashboard, 18),
        "lat": extract(expand("view.latitude"), dashboard, 0),
        "lon": extract(expand("view.longitude"), dashboard, 0),
        "z": extract(expand("view.zoom"), dashboard, 3),
        "listeners": listeners
      });
      //////////////////////////////////////
      // Base Layers
      var baseLayers = geodash.layers.init_baselayers_ol3(geodash.var.map, dashboard["baselayers"]);
      $.extend(geodash.var.baselayers, baseLayers);
      // Load Default/Initial Base Layer
      var baseLayerID = dashboard["view"]["baselayer"] || dashboard["baselayers"][0].id;
      geodash.var.map.addLayer(geodash.var.baselayers[baseLayerID]);
      geodash.api.intend("viewChanged", {'baselayer': baseLayerID}, $scope);
      geodash.api.intend("layerLoaded", {'type':'baselayer', 'layer': baseLayerID}, $scope);
      //////////////////////////////////////
      // Feature Layers
      if(angular.isArray(extract("featurelayers", dashboard)))
      {
        for(var i = 0; i < dashboard.featurelayers.length; i++)
        {
          var fl = dashboard.featurelayers[i];
          //geodash.layers.init_featurelayer(fl.id, fl, $scope, live, dashboard, state);
          geodash.layers.init_featurelayer({
            "id": fl.id,
            "fl": fl,
            "$scope": $scope,
            "dashboard": dashboard,
            "state": state
          });
        }
      }
      setTimeout(function(){
        var loadedFeatureLayers = $.grep(state.view.featurelayers, function(layerID){
          var y = extract(layerID, geodash.var.featurelayers);
          return angular.isDefined(y) && (y instanceof ol.layer.Vector);
        });
        var fitLayers = $.map(loadedFeatureLayers, function(layerID){ return geodash.var.featurelayers[layerID]; });
        var newExtent = ol.extent.createEmpty();
        fitLayers.forEach(function(layer){ ol.extent.extend(newExtent, layer.getSource().getExtent()); });
        var v = geodash.var.map.getView();
        /*geodash.var.map.beforeRender(ol.animation.pan({ duration: 500, source: v.getCenter() }));
        v.fit(newExtent, geodash.var.map.getSize());*/
      }, 4000);

    }
  };
};

geodash.directives.sparcSidebar = function(){
  return {
    controller: geodash.controllers.SPARCControllerSidebar,
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    //scope: {},
    templateUrl: 'sparc_sidebar.tpl.html',
    link: function ($scope, element, attrs, controllers)
    {
      setTimeout(function(){

        var $interpolate = angular.element(document.body).injector().get('$interpolate');

        $('[data-toggle="tooltip"]', element).tooltip();

        geodash.init.typeahead(
          element,
          undefined,
          undefined,
          undefined,
          geodash.config.search.datasets,
          geodash.config.search.codecs
        );

        var jqe = $(element);
        if(Array.isArray($scope.ui.charts))
        {
          for(var i = 0; i < $scope.ui.charts.length; i++)
          {
            var chart = $scope.ui.charts[i];
            var chartOptions = {};
            sparc2.charts.buildHazardChart(chart, geodash.initial_data.layers.popatrisk, chartOptions);
          }
        }

        $(element).on('shown.bs.tab', 'a[data-toggle="tab"]', geodash.ui.update_tab);

        $(element).on('change', 'input:checkbox', function(event) {
          console.log(event);
          var that = this;
          var output = $(that).data('output');
          var filter = {};

          var btngroup = $(that).parents('.btn-group:first');
          var output = btngroup.data('output');
          if(filter[output] == undefined)
          {
            filter[output] = [];
          }
          btngroup.find('input').each(function(){
            if($(this).is(':checked'))
            {
              filter[output].push($(this).data('value'))
              $(this).parent('label').removeClass('btn-default').addClass('btn-primary');
            }
            else
            {
              $(this).parent('label').addClass('btn-default').removeClass('btn-primary');
            }
          });
          geodash.api.intend("filterChanged", {"layer": "popatrisk", "filter": filter}, $scope);
        });

        // Initialize Radio Filters
        $(element).on('change', 'input:radio[name="cat"]', function(event) {
          console.log(event);
          var output = $(this).data('output');
          var filter = {};
          filter[output] = this.value;
          geodash.api.intend("filterChanged", {"layer": "popatrisk", "filter": filter}, $scope);
        });

        // Initialize Slider Filters
        $(".geodash-filter-slider", $(element)).each(function(){

          var slider = $(this).find(".geodash-filter-slider-slider");
          var label = $(this).find(".geodash-filter-slider-label");

          var type = slider.data('type');
          var output = slider.data('output');

          if(type=="ordinal")
          {
            var range = slider.data('range');
            //var value = slider.data('value');
            var value = $scope.state["filters"]["popatrisk"][output];
            var options = slider.data('options');

            slider.data('label', label);
            geodash.ui.init_slider_label($interpolate, slider, type, range, value);
            geodash.ui.init_slider_slider($interpolate, $scope, slider, type, range, options.indexOf(value), 0, options.length - 1, 1);
          }
          else
          {
            var range = slider.data('range');
            //var value = slider.data('value');
            var minValue = geodash.normalize.float(slider.data('min-value'), 0);
            var step = slider.data('step');
            //var label_template = slider.data('label');

            if(($.type(range) == "boolean" && range ) || (range.toLowerCase() == "true"))
            {
              var maxValue = ($scope.maxValueFromSummary != undefined && slider.data('max-value') == "summary") ?
                  $scope.maxValueFromSummary :
                  geodash.normalize.float(slider.data('max-value'), undefined);
              //
              var values = $scope.state["filters"]["popatrisk"][output];
              values = geodash.assert.array_length(values, 2, [minValue, maxValue]);
              var values_n = [Math.floor(values[0]), Math.floor(values[1])];
              var min_n = Math.floor(minValue);
              var max_n = Math.floor(maxValue);
              var step_n = Math.floor(step);

              slider.data('label', label);
              geodash.ui.init_slider_label($interpolate, slider, type, range, values);
              geodash.ui.init_slider_slider($interpolate, $scope, slider, type, range, values_n, min_n, max_n, step_n);
              console.log(value_n, min_n, max_n, step_n, range);
            }
            else
            {
              var maxValue = geodash.normalize.float(slider.data('max-value'), undefined);
              var value = $scope.state["filters"]["popatrisk"][output];
              var value_n = Math.floor(value * 100);
              var min_n = Math.floor(minValue * 100);
              var max_n = Math.floor(maxValue * 100);
              var step_n = Math.floor(step * 100);

              slider.data('label', label);
              geodash.ui.init_slider_label($interpolate, slider, type, range, value);
              geodash.ui.init_slider_slider($interpolate, $scope, slider, type, range, values_n, min_n, max_n, step_n);
              console.log(value_n, min_n, max_n, step_n, range);
            }
          }

        });


      }, 10);
    }
  };
};

geodash.directives["sparcSidebarFeatureLayer"] = function(){
  return {
    controller: geodash.controllers.controller_sparc_sidebar,
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'sparc_sidebar_feature_layer.tpl.html',
    link: function ($scope, $element, attrs, controllers)
    {
      setTimeout(function(){

        var jqe = $($element);
        if($scope.charts != undefined)
        {
          for(var i = 0; i < $scope.charts.length; i++)
          {
            var options = {};
            /*if($scope.charts[i].hazard == "drought")
            {
              options["bullet_width"] = function(d, i)
              {
                if(d.id == "p6")
                {
                  return 6;
                }
                else if(d.id == "p8")
                {
                  return 8;
                }
                else
                {
                  return 16;
                }
              };
            }*/
            buildHazardChart($scope.charts[i], geodash.initial_data.layers.popatrisk, options);
          }
        }

      }, 10);
    }
  };
};

geodash.directives["geodashModalFilterMore"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_filter_more.tpl.html',
    link: function ($scope, element, attrs, controllers){}
  };
};

geodash.directives["geodashFilterCheckbox"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'filter_checkbox.tpl.html',
    link: function ($scope, element, attrs, controllers){}
  };
};

geodash.directives["geodashFilterRadio"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'filter_radio.tpl.html',
    link: function ($scope, element, attrs, controllers){}
  };
};

geodash.directives["geodashFilterSlider"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'filter_slider.tpl.html',
    link: function ($scope, element, attrs, controllers){}
  };
};

geodash.directives.sparcModalWelcome = function(){
  return {
    controller: geodash.controllers.SPARCControllerModalWelcome,
    restrict: 'EA',
    replace: true,
    scope: {},
    templateUrl: 'sparc_modal_welcome.tpl.html',
    link: function ($scope, element, attrs){

      setTimeout(function(){

        //var datasets = [sparc2.typeahead.datasets, geodash.typeahead.datasets];
        //var codecs = [sparc2.bloodhound.codec, geodash.bloodhound.codec];

        geodash.init.typeahead(
          element,
          undefined,
          undefined,
          undefined,
          geodash.config.search.datasets,
          geodash.config.search.codecs
        );

        sparc2.api.welcome();

      }, 10);

    }
  };
};

geodash.directives.geodashMain = function(){
  return {
    controller: geodash.controllers.GeoDashControllerMain,
    restrict: 'EA',
    replace: true,
    scope: {},
    templateUrl: 'main.tpl.html', // Can override with geodash.templates.server
    link: function ($scope, element, attrs, controllers)
    {
      setTimeout(function(){ geodash.ui.update(element); }, 0);
    }
  };
};

geodash.controllers.GeoDashControllerBase = function(
  $scope, $element, $controller,
  $interpolate, $timeout,
  state, dashboard, live)
{
  $scope.setValue = geodash.util.setValue;
  $scope.clearValue = geodash.util.clearValue;

  $scope.stack = {
    'head': undefined, //backtrace[0]
    'prev': undefined, //backtrace[1]
    'backtrace': [] // Full list to include states from other modals
  };

  /*
  * ng-click="clear_field(object_field_id, objectFieldIndex)"
  $scope.clear_field = function(field_flat, field_index)
  {
    if(angular.isDefined(field_flat))
    {
      var fullpath_array = $scope.path_array.concat(field_flat.split("__"));
      $scope.clearValue(fullpath_array, $scope.workspace);
      $.each($scope.workspace_flat, function(key, value){
        if(key.startsWith(fullpath_array.join("__")))
        {
          delete $scope.workspace_flat[key];
          delete $scope.stack.head.workspace_flat[key];
        }
      });
    }
  };*/

  $scope.asset = function(id)
  {
    return geodash.api.getAsset(id);
  };

  $scope.update_stack = function(backtrace)
  {
    if(angular.isDefined(backtrace))
    {
      $scope.stack.backtrace = geodash.util.deepCopy(backtrace);
    }
    if($scope.stack.backtrace.length >= 2)
    {
      $scope.stack.head = $scope.stack.backtrace[0];
      $scope.stack.prev = $scope.stack.backtrace[1];
    }
    else if($scope.stack.backtrace.length == 1)
    {
      $scope.stack.head = $scope.stack.backtrace[0];
      $scope.stack.prev = undefined;
    }
    else
    {
      $scope.stack.head = undefined;
      $scope.stack.prev = undefined;
    }
  };

  $scope.update_main = function(removed)
  {
    if(angular.isDefined($scope.stack.head))
    {
      if(angular.isDefined(removed))
      {
        if($scope.stack.head.modal == removed.modal)
        {
          $.each($scope.stack.head, function(key, value){ $scope[key] = value;});
        }
      }
      else
      {
        $.each($scope.stack.head, function(key, value){ $scope[key] = value;});
      }
    }
  };

  $scope.expand = function(x)
  {
    if(angular.isDefined(x))
    {
      if(angular.isDefined(x.schemapath))
      {
        x.schemapath_flat = x.schemapath.replace(new RegExp("\\.", "gi"), "__");
        x.schemapath_array = x.schemapath.split(".");
      }

      if(angular.isDefined(x.basepath))
      {
        if(! angular.isDefined(x.basepath_array)){ x.basepath_array = x.basepath.split("."); }
        if(angular.isDefined(x.schemapath))
        {
          x.object_fields = extract(x.schemapath_array.concat(["schema", "fields"]), x.schema, []);
        }
        else
        {
          x.object_fields = extract(x.basepath_array.concat(["schema", "fields"]), x.schema, []);
        }
        if(angular.isDefined(x.objectIndex))
        {
          x.path = x.basepath + "." + x.objectIndex;
          x.path_flat = x.path.replace(new RegExp("\\.", "gi"), "__");
          x.path_array = x.basepath_array.concat([x.objectIndex]);
        }
        else
        {
          x.path = x.basepath;
          x.path_flat = x.path.replace(new RegExp("\\.", "gi"), "__");
          x.path_array = x.path.length > 0 ? x.path.split(".") : [];
        }
      }
      else if(angular.isDefined(x.path))
      {
        x.path_flat = x.path.replace(new RegExp("\\.", "gi"), "__");
        x.path_array = x.path.length > 0 ? x.path.split(".") : [];
      }
      else if(angular.isDefined(x.objectIndex))
      {
        x.basepath_array = [];
        x.path = x.objectIndex;
        x.path_flat = x.path.replace(new RegExp("\\.", "gi"), "__");
        x.path_array = [x.objectIndex];
      }

      if(angular.isDefined(x.workspace))
      {
        x.workspace_flat = geodash.util.flatten(x.workspace);
      }

      if(angular.isDefined(x.schema))
      {
        x.schema_flat = geodash.util.flatten(x.schema);
      }
    }
    return x;
  };

  $scope.api = function(name)
  {
    if(angular.isDefined($scope.workspace))
    {
      var slug = geodash.util.getScope('geodash-main')['state']['slug'];
      if(angular.isString(slug) && slug.length > 0)
      {
        var template = geodash.api.getEndpoint(name);
        if(template != undefined)
        {
          return $interpolate(template)({ 'slug': slug });
        }
      }
      else
      {
        return "#";
      }
    }
    else
    {
      return "#";
    }
  };

  $scope.push = function(x, backtrace)
  {
    $scope.clear(); // Clean Old Values
    x = $scope.expand(x);
    $scope.update_stack([x].concat(backtrace || $scope.stack.backtrace));
    $.each($scope.stack.head, function(key, value){ $scope[key] = value; });
    $scope.update_breadcrumbs();
  };

  $scope.update_breadcrumbs = function()
  {
    var breadcrumbs = [];
    if(angular.isDefined(extract('stack.backtrace', $scope)))
    {
      for(var i = $scope.stack.backtrace.length - 1; i >= 0; i--)
      {
        var x = $scope.stack.backtrace[i];
        if(angular.isDefined(x.objectIndex))
        {
          var obj = extract(x.path_array, x.workspace);
          var content = extract('title', obj) || extract('id', obj) || x.objectIndex;
          var link = "#";
          var bc = {'content': content, 'link': link};
          breadcrumbs.push(bc);
        }
        else
        {
          var keyChain = x.schemapath_array || x.basepath_array;
          if(angular.isDefined(keyChain))
          {
            var f = extract(keyChain, x.schema);
            if(angular.isDefined(f))
            {
              var t = extract("type", f);
              var content = undefined;
              var link = "#";
              if(t == "object")
              {
                content = extract("schema.verbose_singular", f) || extract("label", f);
              }
              else if(t == "objectarray" || t == "stringarray" || t == "textarray" || t == "templatearray")
              {
                content = extract("schema.verbose_plural", f) || extract("label", f);
              }
              else
              {
                content = extract("label", f);
              }
              var bc = {'content': content, 'link': link};
              breadcrumbs.push(bc);
            }
          }
        }
      }
      $scope.breadcrumbs = breadcrumbs;
    }
    return breadcrumbs;
  };

  $scope.update_ui = function(removed, backtrace)
  {
    if(angular.isDefined($scope.stack.head))
    {
      if(angular.isDefined($scope.stack.head.modal))
      {
        if($scope.stack.head.modal == removed.modal)
        {
          $scope.update_breadcrumbs();
          $timeout(function(){ geodash.ui.update($scope.stack.head.modal); },0);
        }
        else
        {
          var oldModal = removed.modal;
          var newModal = $scope.stack.head.modal;
          $("#"+oldModal).modal('hide');
          $("#"+newModal).modal({'backdrop': 'static', 'keyboard':false});
          //var newScope = geodash.util.getScope(newModal);
          // newScope.clear(); Should have already happened in clear_all
          $timeout(function(){
            var newScope = geodash.util.getScope(newModal);
            newScope.update_stack(backtrace);
            $.each(newScope.stack.head, function(key, value){ newScope[key] = value;});
            newScope.update_breadcrumbs();
            $("#"+newModal).modal('show');
            $timeout(function(){ geodash.ui.update(newModal); },0);
          }, 0);
        }
      }
      else
      {
        var oldModal = removed.modal;
        $("#"+oldModal).modal('hide');
      }
    }
    else
    {
      $("#"+removed.modal).modal('hide');
    }
  };


  $scope.clear = function()
  {
    $scope.clear_all(1);
  };

  $scope.clear_all = function(count)
  {
    var backtrace = $scope.stack.backtrace;
    if(backtrace.length > 0)
    {
      var clear_array = [
        "workspace", "workspace_flat",
        "schema", "schema_flat",
        "basepath", "basepath_flat", "basepath_array",
        "schemapath", "schemapath_flat", "schemapath_array",
        "objectIndex",
        "path", "path_flat", "path_array",
        "breadcrumbs"];
      var scopes = {};
      var s = undefined;
      for(var i = 0; i < count && i < backtrace.length; i++)
      {
        var x = backtrace[i];
        if(angular.isUndefined(s))
        {
          var m = extract('modal', x);
          s = angular.isDefined(m) ? geodash.util.getScope(m) : $scope;
        }
        $.each(x, function(key, value){ s[key] = undefined; });
        $.each(clear_array, function(index, value){ s[value] = undefined; });
      }
    }
  };


  $scope.includeTypeaheadForField = function(field)
  {
    var include = false;
    if(angular.isDefined(field))
    {
      if(extract("options", field, []).length > 0)
      {
        include = true;
      }
      else if(angular.isDefined(extract("search.datasets", field)))
      {
        var datasets = extract("search.datasets", field);
        if((angular.isString(datasets) || Array.isArray(datasets)) && datasets.length > 0)
        {
          include = true;
        }
      }
      else if(angular.isString(extract("search.dataset", field)))
      {
        if(extract("search.dataset", field).length > 0)
        {
          include = true;
        }
      }
      else if(angular.isDefined(extract("search.local", field)))
      {
        if(angular.isString(extract("search.local", field)))
        {
          if(extract("search.local", field).length > 0)
          {
            include = true;
          }
        }
        else if(angular.isString(extract("search.local.name", field)))
        {
          include = true;
        }
      }
      else if(angular.isDefined(extract("search.remote", field, undefined)))
      {
        include = true;
      }
    }
    return include;
  };


$scope.typeaheadDatasetsForSearch = function(x)
{
  var datasets = "";

  if(! angular.isDefined(x))
  {
    x = extract($scope.schemapath, $scope.schema, undefined);
  }

  if(angular.isDefined(x))
  {
    if(Array.isArray(extract("search.datasets", x)))
    {
      datasets = extract("search.datasets", x).join(",");
    }
    else if(angular.isString(extract("search.datasets", x)))
    {
      datasets = extract("search.datasets", x);
    }
    else if(angular.isString(extract("search.dataset", x)))
    {
      datasets = extract("search.dataset", x);
    }
  }
  return datasets;
};

  $scope.localDataForSearch = function(x)
  {
    var localData = "";

    if(! angular.isDefined(x))
    {
      x = extract($scope.schemapath, $scope.schema, undefined);
    }

    if(angular.isDefined(x))
    {
      localData = extract("options", x, "");

      if(localData.length == 0)
      {
        localData = extract("search.local", x, "");
      }

    }
    return localData;
  };

  $scope.remoteDataForSearch = function(x)
  {
    var data = "";

    if(! angular.isDefined(x))
    {
      x = extract($scope.schemapath, $scope.schema, undefined);
    }

    if(angular.isDefined(x))
    {
      data = extract("search.remote", x, {});
    }

    return data;
  };
  $scope.initialValueForSearch = function(x)
  {
    var data = "";

    if(! angular.isDefined(x))
    {
      x = extract($scope.schemapath, $scope.schema, undefined);
    }

    if(angular.isDefined(x))
    {
      data = extract("search.initial", x, {});
    }

    return data;
  };
  $scope.outputForSearch = function()
  {
    var data = "";
    var schema = extract($scope.schemapath, $scope.schema, undefined);
    if(angular.isDefined(schema))
    {
      data = extract("search.output", schema, "");
    }
    return data;
  };
  $scope.datasetsForSearch = function()
  {
    var data = "";
    var schema = extract($scope.schemapath, $scope.schema, undefined);
    if(angular.isDefined(schema))
    {
      data = extract("search.datasets", schema, "");
    }
    return data;
  };

  $scope.asset = function(id)
  {
    return geodash.util.getByID(id, $scope.workspace.config.assets);
  };
};

geodash.controllers.GeoDashControllerModal = function(
  $scope, $element, $controller, $interpolate, $timeout,
  state, dashboard, live)
{
  angular.extend(this, $controller('GeoDashControllerBase', {$element: $element, $scope: $scope}));

  $scope.showOptions = geodash.ui.showOptions;

  $scope.stack = {
    'head': undefined, //backtrace[0]
    'prev': undefined, //backtrace[1]
    'backtrace': [] // Full list to include states from other modals
  };

  $scope.showModal = function(x)
  {
    if(angular.isString(x))
    {
      return x != "";
    }
    else if(angular.isNumber(x))
    {
      return x >= 0;
    }
    else
    {
      return true;
    }
  };

  $scope.edit_field = function(field_id, field_index)
  {
    var schemapath = $scope.stack.head.path;
    if(angular.isDefined($scope.stack.head.schemapath_array) && angular.isDefined(field_index))
    {
      schemapath = $scope.stack.head.schemapath + ".schema.fields."+field_index;
    }
    var x = {
      'modal': 'geodash-modal-edit-field',
      'tab': 'modal-edit-field-pane-input',
      'prev': $scope.stack.head.modal,
      'workspace': $scope.stack.head.workspace,
      'schema': $scope.stack.head.schema,
      'basepath': $scope.stack.head.path,
      'basepath_array': $scope.stack.head.path_array,
      'schemapath': schemapath,
      'objectIndex': field_id
    };
    console.log('New X:');
    console.log(x);

    if($scope.stack.head.modal == x.modal)
    {
      // https://groups.google.com/forum/#!search/string$20input$20ng-repeat%7Csort:relevance/angular/VD77QR1J6uQ/sh-9HNkZu4IJ
      $scope.clear();
      $timeout(function(){$scope.push(x);},0);
    }
    else
    {
      $("#"+$scope.stack.head.modal).modal('hide');
      geodash.util.getScope(x.modal).push(x, $scope.stack.backtrace);
      $("#"+x.modal).modal({'backdrop': 'static','keyboard':false});
      $("#"+x.modal).modal('show');
      $timeout(function(){ geodash.ui.update(x.modal, x.tab); },0);
    }

  };

  $scope.pop = function()
  {
    var removed = $scope.stack.backtrace.shift();
    $scope.update_stack();
    $scope.update_main(removed);
    $scope.update_ui(removed, $scope.stack.backtrace);
  };


  $scope.rollback_all = function(index)
  {
    var count = $scope.stack.backtrace.length;
    $scope.clear_all(count);
    $timeout(function(){
      var removed = $scope.stack.backtrace[0];
      $scope.update_stack($scope.stack.backtrace.slice(count));
      $scope.update_main(removed);
      $scope.update_ui(removed, $scope.stack.backtrace);
    },0);
  };
  $scope.rollback = function(index)
  {
    var count = undefined;
    if(angular.isNumber(index))
    {
      count = $scope.stack.backtrace.length - index - 1;
    }
    else
    {
      count = 1;
    }
    $scope.clear_all(count);
    $timeout(function(){
      var removed = $scope.stack.backtrace[0];
      $scope.update_stack($scope.stack.backtrace.slice(count));
      $scope.update_main(removed);
      $scope.update_ui(removed, $scope.stack.backtrace);
    },0);
  };

  $scope.go_back = function()
  {
    $scope.clear();
    $timeout(function(){$scope.pop();},0);
  };

  $scope.add_object = function(field_id)
  {
    //var value = extract($scope.stack.head.path, $scope.stack.head.workspace);
    //var length = angular.isDefined(value) ? value.length : 0;
    $scope.edit_object(extractArrayLength($scope.stack.head.path, $scope.stack.head.workspace, 0));
  };

  $scope.search_object = function()
  {
    var field_id = extractArrayLength($scope.stack.head.path, $scope.stack.head.workspace, 0)
    var field_index = undefined;
    /////////////
    var schemapath = $scope.stack.head.schemapath || $scope.stack.head.path;
    if(angular.isDefined($scope.stack.head.schemapath) && angular.isDefined(field_index))
    {
      schemapath = $scope.stack.head.schemapath + ".schema.fields."+field_index;
    }
    var x = {
      'modal': 'geodash-modal-search-object',
      'tab': 'modal-search-object-pane-input',
      'prev': $scope.stack.head.modal,
      'workspace': $scope.stack.head.workspace,
      'schema': $scope.stack.head.schema,
      'basepath': $scope.stack.head.path,
      'basepath_array': $scope.stack.head.path_array,
      'schemapath': schemapath,
      'objectIndex': field_id
    };
    console.log('New X:');
    console.log(x);

    if($scope.stack.head.modal == x.modal)
    {
      // https://groups.google.com/forum/#!search/string$20input$20ng-repeat%7Csort:relevance/angular/VD77QR1J6uQ/sh-9HNkZu4IJ
      $scope.clear();
      $timeout(function(){
        $scope.push(x);
        $timeout(function(){ geodash.ui.update(x.modal, x.tab); },0);
      },0);
    }
    else
    {
      $("#"+$scope.stack.head.modal).modal('hide');
      var targetScope = geodash.util.getScope(x.modal);
      var backtrace = $scope.stack.backtrace;
      targetScope.clear();
      $timeout(function(){
        targetScope.push(x, backtrace);
        var m = $("#"+x.modal);
        m.modal({'backdrop': 'static','keyboard':false});
        m.modal('show');
        $timeout(function(){ geodash.ui.update(x.modal, x.tab); },0);
      },0);
    }
  };

  $scope.edit_object = function(field_id, field_index)
  {
    var schemapath = $scope.stack.head.schemapath || $scope.stack.head.path;
    if(angular.isDefined($scope.stack.head.schemapath) && angular.isDefined(field_index))
    {
      schemapath = $scope.stack.head.schemapath + ".schema.fields."+field_index;
    }
    var x = {
      'modal': 'geodash-modal-edit-object',
      'tab': 'modal-edit-object-pane-input',
      'prev': $scope.stack.head.modal,
      'workspace': $scope.stack.head.workspace,
      'schema': $scope.stack.head.schema,
      'basepath': $scope.stack.head.path,
      'basepath_array': $scope.stack.head.path_array,
      'schemapath': schemapath,
      'objectIndex': field_id
    };
    console.log('New X:');
    console.log(x);

    if($scope.stack.head.modal == x.modal)
    {
      // https://groups.google.com/forum/#!search/string$20input$20ng-repeat%7Csort:relevance/angular/VD77QR1J6uQ/sh-9HNkZu4IJ
      $scope.clear();
      $timeout(function(){
        $scope.push(x);
        $timeout(function(){ geodash.ui.update(x.modal, x.tab); },0);
      },0);
    }
    else
    {
      $("#"+$scope.stack.head.modal).modal('hide');
      var targetScope = geodash.util.getScope(x.modal);
      var backtrace = $scope.stack.backtrace;
      targetScope.clear();
      $timeout(function(){
        targetScope.push(x, backtrace);
        var m = $("#"+x.modal);
        m.modal({'backdrop': 'static','keyboard':false});
        m.modal('show');
        $timeout(function(){ geodash.ui.update(x.modal, x.tab); },0);
      },0);
    }
  };

  $scope.save_object = function()
  {
    var workspace = $scope.workspace;
    var workspace_flat = $scope.workspace_flat;
    $scope.clear_all(2);
    $timeout(function(){
      // By using $timeout, we're sure the template was reset (after we called $scope.clear)
      //var ret = $scope.stack.list.shift();
      var saved = $scope.stack.backtrace.shift();
      if($scope.stack.backtrace.length > 0)
      {
        var backtrace = $scope.stack.backtrace;
        backtrace[0]['workspace'] = workspace;
        backtrace[0]['workspace_flat'] = workspace_flat;
        $scope.update_stack(backtrace);
        if($scope.stack.head.modal == saved.modal)
        {
          $.each($scope.stack.head, function(key, value){ $scope[key] = value;});
          $scope.workspace = $scope.stack.head.workspace = workspace;
          $scope.workspace_flat = $scope.stack.head.workspace_flat = workspace_flat;
          $scope.update_breadcrumbs();
        }
        else
        {
          var oldModal = saved.modal;
          var newModal = $scope.stack.head.modal;
          $("#"+oldModal).modal('hide');
          $("#"+newModal).modal({'backdrop': 'static', 'keyboard':false});
          $timeout(function(){
            var newScope = geodash.util.getScope(newModal);
            newScope.update_stack(backtrace);
            $.each(newScope.stack.head, function(key, value){ newScope[key] = value;});
            newScope.update_breadcrumbs();
            $("#"+newModal).modal('show');
            $timeout(function(){ geodash.ui.update(newModal); },0);
          },0);
        }
      }
      else
      {
        var targetScope = geodash.util.getScope("geodash-sidebar-right");
        targetScope.stack.head.workspace =  targetScope.workspace = workspace;
        targetScope.stack.head.workspace_flat =  targetScope.workspace_flat = workspace_flat;
        $("#"+saved.modal).modal('hide');
      }
    },0);
  };

  $scope.modal_title = function()
  {
    var breadcrumbs = [];
    for(var i = $scope.stack.backtrace.length - 1; i >= 0; i--)
    {
      var x = $scope.stack.backtrace[i];
      if(angular.isDefined(x.objectIndex))
      {
        var obj = extract(x.path_array, x.workspace);
        breadcrumbs.push(extract('title', obj) || extract('id', obj) || x.objectIndex);
      }
      else
      {
        var f = extract(x.schemapath_array || x.basepath_array, x.schema);
        if(angular.isDefined(f))
        {
          var t = extract("type", f);
          if(t == "object")
          {
            breadcrumbs.push(extract("schema.verbose_singular", f) || extract("label", f));
          }
          else if(t == "objectarray" || t == "stringarray" || t == "textarray" || t == "templatearray")
          {
            breadcrumbs.push(extract("schema.verbose_plural", f) || extract("label", f));
          }
          else
          {
            breadcrumbs.push(extract("label", f));
          }
        }
      }
    }
    return "Edit / " + breadcrumbs.join(" / ");
  };

  $scope.back_label = function()
  {
    var label = "Cancel";
    if(angular.isDefined($scope.stack.head) && $scope.stack.backtrace.length > 1)
    {
      var x = $scope.stack.backtrace[1];
      var t = extract((x.schemapath_array || x.basepath_array), x.schema);
      if(t.type == "objectarray" && angular.isNumber($scope.stack.head.objectIndex))
      {
        label = "Back to "+(extract("schema.verbose_plural", t) || extract("label", t));
      }
      else
      {
        label = "Back to "+(extract("schema.verbose_singular", t) || extract("label", t));
      }
    }
    return label;
  };

  $scope.save_label = function()
  {
    var label = "";
    if(angular.isDefined($scope.stack.head))
    {
      var x = $scope.stack.head;
      var t = extract((x.schemapath_array || x.basepath_array), x.schema);
      if(t.type == "objectarray" && (! angular.isDefined($scope.stack.head.objectIndex)))
      {
        label = "Save "+(extract("schema.verbose_plural", t) || extract("label", t) || "Object");
      }
      else
      {
        label = "Save "+(extract("schema.verbose_singular", t) || "Object");
      }
    }
    else
    {
      label = "Save";
    }
    return label;
  };
};

geodash.controllers.GeoDashControllerLegend = function($scope, $element, $controller, $timeout)
{
  angular.extend(this, $controller('GeoDashControllerBase', {$element: $element, $scope: $scope}));
  //
  var mainScope = $element.parents(".geodash-dashboard:first").isolateScope();
  $scope.dashboard = geodash.util.deepCopy(mainScope.dashboard);
  $scope.dashboard_flat = geodash.util.deepCopy(mainScope.dashboard_flat);
  $scope.state = geodash.util.deepCopy(mainScope.state);
  $scope.assets = geodash.util.arrayToObject(extract("assets", $scope.dashboard));
  $scope.grid = extract("legend.grid", $scope.dashboard);
  $scope.defaultGrid = [
    "col-sm-3",
    "col-sm-9"
  ];
  //////////////

  $scope.class = function(column)
  {
    if(angular.isNumber(column) && column >= 0)
    {
      return extract([column], $scope.grid, $scope.defaultGrid[column]);
    }
    else
    {
      return "";
    }
  };

  $scope.style = function()
  {
    var styleMap = {};
    var legend = extract("legend", $scope.dashboard);
    if(angular.isDefined(legend))
    {
      angular.extend(styleMap,{
        "top": extract("position.top", legend, 'auto'),
        "bottom": extract("position.bottom", legend, 'auto'),
        "left": extract("position.left", legend, 'auto'),
        "right": extract("position.right", legend, 'auto'),
        "width": extract("width", legend, 'initial'),
        "height": extract("height", legend, 'initial'),
        "padding": "0",
        "margin": "0",
        "background": "transparent",
        "opacity": "1.0"
      });

      /*angular.extend(styleMap, {
        "font-family": extract("text.font.family", overlay, 'Arial'),
        "font-size": extract("text.font.size", overlay, '12px'),
        "font-style": extract("text.font.style", overlay, 'normal'),
        "text-shadow": extract("text.shadow", overlay, 'none')
      });*/

      if(angular.isDefined(extract("css.properties", legend)))
      {
        angular.extend(styleMap, geodash.util.arrayToObject(extract("css.properties", legend)));
      }
    }

    return geodash.codec.formatCSS(styleMap);
  };

  $scope.getLegendType = function(layer, style)
  {
    var styleID = angular.isDefined(style) ? style : 0;

    if(angular.isDefined(extract("wms", layer)))
    {
      return "legendgraphic";
    }
    else if(angular.isDefined(extract("carto", layer)))
    {
      return extract(["carto", "styles", styleID, "legend", "type"], layer, "none");
    }
    else
    {
      return "none";
    }
  };

  $scope.getLegendGraphicStyle = function(layer)
  {
    var styleMap = {};
    if(angular.isDefined(extract("wms", layer)))
    {
      angular.extend(styleMap, {
        "min-width": "40px",
        "max-height": "200px"
      });
      //angular.extend(styleMap, geodash.ui.css.tiledBackground(10, "#555"));
    }
    return styleMap;
  };
  $scope.getCurrentStyle = function(layer)
  {
    var currentStyle = undefined;
    if(angular.isDefined(layer))
    {
      var styleID = 0;
      currentStyle = extract(["carto", "styles", styleID], layer);
    }
    return currentStyle;
  };
  $scope.getLegendGraphicURL = function(layer)
  {
    var url = "";
    var baseurl = extract("wms.url", layer);
    if(angular.isString(baseurl))
    {
      var params = {
        "REQUEST": "GetLegendGraphic",
        "VERSION": extract("wms.version", layer, "1.1.1"),
        "FORMAT": extract("wms.format", layer, "image/png"),
        "LAYER": geodash.codec.formatArray("wms.layers", layer),
        "TRANSPARENT": "true"
      };
      if(angular.isDefined(extract("wms.styles", layer)))
      {
        params["STYLE"] = layer["wms"]["styles"];
      }
      var querystring = $.map(geodash.util.objectToArray(params), function(x){ return x["name"]+"="+x["value"]; });
      url = baseurl+"?"+querystring.join("&");
    }
    return url;
  };
  $scope.getColorRamp = function(layer, style)
  {
    var styleID = angular.isDefined(style) ? style : 0;
    var ramp = undefined;
    if(angular.isDefined(layer))
    {
      var styleID = 0;
      var symbolizers = extract(["carto", "styles", styleID, "symbolizers"], layer, []);
      for(var i = 0; i < symbolizers.length; i++)
      {
        var symbolizer = symbolizers[i];
        if(symbolizer.type == "polygon")
        {
          ramp = extract(["dynamic", "options", "colors", "ramp"], symbolizer);
          if(angular.isDefined(ramp))
          {
            break;
          }
        }
      }
    }
    return ramp;
  };

  $scope.updateVariables = function()
  {

    //if("baselayers" in $scope.dashboard && $scope.dashboard.baselayers != undefined)
    if(Array.isArray(extract("baselayers", $scope.dashboard)))
    {
      //var baselayers = $.grep($scope.dashboard.baselayers,function(x, i){ return $.inArray(x["id"], arrayFilter) != -1; });
      //baselayers.sort(function(a, b){ return $.inArray(a["id"], arrayFilter) - $.inArray(b["id"], arrayFilter); });
      $scope.baselayers = $scope.dashboard.baselayers;
    }
    else
    {
      $scope.baselayers = [];
    }

    if(Array.isArray(extract("featurelayers", $scope.dashboard)))
    {
      //var featurelayers = $.map($scope.dashboard.featurelayers, function(item, key){ return {'key': key, 'item': item}; });
      //var featurelayers = $.grep($scope.dashboard.featurelayers,function(x, i){ return $.inArray(x["id"], arrayFilter) != -1; });
      //featurelayers.sort(function(a, b){ return $.inArray(a["id"], arrayFilter) - $.inArray(b["id"], arrayFilter); });
      //$scope.featurelayers = featurelayers;
      $scope.featurelayers = $scope.dashboard.featurelayers;
      if(angular.isDefined(extract("state.view.featurelayers", $scope)))
      {
        var visibleFeaturelayers = $.grep($scope.featurelayers,function(x, i){
          return $.inArray(x["id"], $scope.state.view.featurelayers) != -1;
        });
        visibleFeaturelayers.sort(function(a, b){ return $.inArray(a["id"], $scope.state.view.featurelayers) - $.inArray(b["id"], $scope.state.view.featurelayers); });
        $scope.visibleFeaturelayers = visibleFeaturelayers;
      }
      else
      {
        $scope.visibleFeaturelayers = [];
      }
    }
    else
    {
      $scope.featurelayers = [];
      $scope.visibleFeaturelayers = [];
    }

  };
  $scope.updateVariables();
  //$scope.$watch('dashboard.featurelayers', $scope.updateVariables);
  //$scope.$watch('dashboard.legendlayers', $scope.updateVariables);
  $scope.$watch('state', $scope.updateVariables);
  //////////////
  var jqe = $($element);

  $scope.$on("refreshMap", function(event, args)
  {
    console.log('args: ', args);

    if(geodash.util.diff(["view.featurelayers", "view.baselayer"], $scope.state, args.state).length > 0)
    {
      $scope.state = undefined;
      $scope.newState = geodash.util.deepCopy(args.state);
      $scope.updateVariables();

      setTimeout(function(){
        $scope.$apply(function(){
          $scope.state = $scope.newState;
          $scope.updateVariables();
        });
      },0);
    }
    else
    {
      $scope.state = geodash.util.deepCopy(args.state);
      $scope.updateVariables();
    }

  });
};

geodash.controllers.GeoDashControllerOverlays = function($scope, $element, $controller)
{
  angular.extend(this, $controller('GeoDashControllerBase', {$element: $element, $scope: $scope}));
  //
  var mainScope = $element.parents(".geodash-dashboard:first").isolateScope();
  $scope.dashboard = mainScope.dashboard;
  $scope.dashboard_flat = mainScope.dashboard_flat;
  $scope.state = mainScope.state;
  $scope.assets = geodash.util.arrayToObject(extract("assets", $scope.dashboard));
  //////////////

  $scope.imageURL = function(overlay)
  {
    if(angular.isString(extract("image.url", overlay)) && extract("image.url", overlay).length > 0)
    {
      return extract("image.url", overlay);
    }
    else if(angular.isDefined(extract("image.asset", overlay)) && extract("image.asset", overlay).length > 0 )
    {
      return extract([extract("image.asset", overlay), "url"], $scope.assets);
    }
    else
    {
      return "";
    }
  };

  $scope.style = function(type, overlay)
  {
    var styleMap = {};

    angular.extend(styleMap,{
      "top": extract("position.top", overlay, 'auto'),
      "bottom": extract("position.bottom", overlay, 'auto'),
      "left": extract("position.left", overlay, 'auto'),
      "right": extract("position.right", overlay, 'auto'),
      "width": extract("width", overlay, 'initial'),
      "height": extract("height", overlay, 'initial'),
      "padding": "0",
      "margin": "0",
      "background": "transparent",
      "opacity": "1.0"
    });

    if(type == "text")
    {
      angular.extend(styleMap, {
        "font-family": extract("text.font.family", overlay, 'Arial'),
        "font-size": extract("text.font.size", overlay, '12px'),
        "font-style": extract("text.font.style", overlay, 'normal'),
        "text-shadow": extract("text.shadow", overlay, 'none')
      });
    }
    else if(type == "image")
    {

    }

    if(angular.isDefined(extract("intent", overlay)))
    {
      angular.extend(styleMap, {
        "cursor": "pointer"
      });
    }

    if(angular.isDefined(extract("css.properties", overlay)))
    {
      angular.extend(styleMap, geodash.util.arrayToObject(extract("css.properties", overlay)));
    }

    return geodash.codec.formatCSS(styleMap);
  };

};

geodash.controllers["SPARCControllerCalendar"] = function($scope, $element, $controller, $interpolate)
{
  angular.extend(this, $controller('GeoDashControllerBase', {$element: $element, $scope: $scope}));

  var mainScope = $element.parents(".geodash-dashboard:first").isolateScope();
  $scope.dashboard = geodash.util.deepCopy(mainScope.dashboard);
  $scope.state = geodash.util.deepCopy(mainScope.state);
  $scope.months = MONTHS_ALL;

  $scope.$on("refreshMap", function(event, args)
  {
    $scope.state = geodash.util.deepCopy(args.state);
  });

  $scope.linkForMonth = function(month)
  {
    return $interpolate(geodash.api.getPage("countryhazardmonthdetail"))({ state: $scope.state, month: month });
  };
};

geodash.controllers.GeoDashControllerMapMap = function(
  $rootScope, $scope, $element, $controller,
  $http, $q,
  $compile, $interpolate, $templateCache, $timeout) {
  //////////////////////////////////////
  angular.extend(this, $controller("GeoDashControllerBase", {$element: $element, $scope: $scope}));

  var mainScope = $element.parents(".geodash-dashboard:first").isolateScope();
  $scope.dashboard = mainScope.dashboard;
  $scope.dashboard_flat = mainScope.dashboard_flat;
  $scope.state = mainScope.state;

  $scope.processEvent = function(event, args)
  {
    var c = $.grep(geodash.meta.controllers, function(x, i){
      return x['name'] == 'GeoDashControllerMapMap';
    })[0];

    for(var i = 0; i < c.handlers.length; i++)
    {
      if(c.handlers[i]['event'] == event.name)
      {
        geodash.handlers[c.handlers[i]['handler']]($scope, $interpolate, $http, $q, event, args);
      }
    }
  };

  var c = $.grep(geodash.meta.controllers, function(x, i){
    return x['name'] == 'GeoDashControllerMapMap';
  })[0];
  for(var i = 0; i < c.handlers.length; i++)
  {
    $scope.$on(c.handlers[i]['event'], $scope.processEvent);
  }
  //////////////////////////////////////

  //////////////////////////////////////
  // The Map

  //////////////////////////////////////
  $scope.$on("refreshMap", function(event, args) {
    // Forces Refresh
    console.log("Refreshing map...");
    // Update Visibility
    var visibleBaseLayer = args.state.view.baselayer;
    var currentLayers = geodash.mapping_library == "ol3" ? geodash.var.map.getLayers().getArray() : undefined;
    $.each(geodash.var.baselayers, function(id, layer) {
      var visible = id == visibleBaseLayer;
      if(geodash.mapping_library == "ol3")
      {
        if($.inArray(layer, currentLayers) != -1 && !visible)
        {
          geodash.var.map.removeLayer(layer);
        }
        else if($.inArray(layer, currentLayers) == -1 && visible)
        {
          geodash.var.map.addLayer(layer);
        }
      }
      else
      {
        if(geodash.var.map.hasLayer(layer) && !visible)
        {
          geodash.var.map.removeLayer(layer);
        }
        else if((! geodash.var.map.hasLayer(layer)) && visible)
        {
          geodash.var.map.addLayer(layer);
        }
      }
    });
    var visibleFeatureLayers = args.state.view.featurelayers;
    $.each(geodash.var.featurelayers, function(id, layer) {
      var visible = $.inArray(id, visibleFeatureLayers) != -1;
      if(geodash.mapping_library == "ol3")
      {
        if($.inArray(layer, currentLayers) != -1 && !visible)
        {
          geodash.var.map.removeLayer(layer);
        }
        else if($.inArray(layer, currentLayers) == -1 && visible)
        {
          geodash.var.map.addLayer(layer);
        }
      }
      else
      {
        if(geodash.var.map.hasLayer(layer) && !visible)
        {
          geodash.var.map.removeLayer(layer);
        }
        else if((! geodash.var.map.hasLayer(layer)) && visible)
        {
          geodash.var.map.addLayer(layer);
        }
      }
    });
    // Update Render Order
    var renderLayers = $.grep(layersAsArray(geodash.var.featurelayers), function(layer){ return $.inArray(layer["id"], visibleFeatureLayers) != -1;});
    var renderLayersSorted = sortLayers($.map(renderLayers, function(layer, i){return layer["layer"];}),true);
    var baseLayersAsArray = $.map(geodash.var.baselayers, function(layer, id){return {'id':id,'layer':layer};});
    var baseLayers = $.map(
      $.grep(layersAsArray(geodash.var.baselayers), function(layer){return layer["id"] == visibleBaseLayer;}),
      function(layer, i){return layer["layer"];});
    updateRenderOrder(baseLayers.concat(renderLayersSorted));
    // Force Refresh
    if(geodash.mapping_library == "ol3")
    {
      setTimeout(function(){

        var m = geodash.var.map;
        m.renderer_.dispose();
        m.renderer_ = new ol.renderer.canvas.Map(m.viewport_, m);
        //m.updateSize();
        m.renderSync();

      }, 0);
    }
    else if(geodash.mapping_library == "leaflet")
    {
      setTimeout(function(){ geodash.var.map._onResize(); }, 0);
    }
  });

  $scope.$on("changeView", function(event, args) {
    console.log("Refreshing map...");
    if(angular.isDefined(extract("layer", args)))
    {
      if(geodash.mapping_library == "ol3")
      {
        var layer = geodash.var.featurelayers[args["layer"]];
        var v = geodash.var.map.getView();
        geodash.var.map.beforeRender(ol.animation.pan({ duration: 1000, source: v.getCenter() }));
        v.fit(layer.getSource().getExtent(), geodash.var.map.getSize());
      }
      else if(geodash.mapping_library == "leaflet")
      {
        geodash.var.map.fitBounds(geodash.var.featurelayers[args["layer"]].getBounds());
      }
    }
    else if(angular.isDefined(extract("zoom", args)))
    {
      var v = geodash.var.map.getView();
      /*geodash.var.map.beforeRender(ol.animation.zoom({ duration: 250, source: v.getResolution() }));
      var resolution = ---
      ol.interaction.Interaction.zoomWithoutConstraints(
        geodash.var.map,
        v,
        resolution,
        false,
        250
      )*/
      v.setZoom(extract("zoom", args));
    }
  });

  $scope.$on("openPopup", function(event, args) {
    console.log("Opening popup...");
    if(
      args["featureLayer"] != undefined &&
      args["feature"] != undefined &&
      args["location"] != undefined)
    {
      geodash.popup.openPopup(
        $interpolate,
        args["featureLayer"],
        args["feature"],
        args["location"],
        geodash.var.map,
        geodash.util.getScope("geodash-main").state
      );
    }
  });
};

geodash.controllers.SPARCControllerSidebar = function($scope, $element, $controller, $timeout)
{
  angular.extend(this, $controller('GeoDashControllerBase', {$element: $element, $scope: $scope}));
  //
  var mainScope = $element.parents(".geodash-dashboard:first").isolateScope();
  $scope.dashboard = mainScope.dashboard;
  $scope.state = mainScope.state;

  //
  $scope.html5data = sparc2.api.html5data;
  $scope.ui = $scope.dashboard.sidebar.ui;
  $scope.showOptions = geodash.ui.showOptions;

  $scope.maxValueFromSummary = geodash.initial_data.layers.popatrisk["data"]["summary"]["all"]["max"]["at_admin2_month"];

  $scope.updateVariables = function(){

    if("baselayers" in $scope.dashboard && $scope.dashboard.baselayers != undefined)
    {
      var baselayers = $.grep($scope.dashboard.baselayers,function(x, i){ return $.inArray(x["id"], $scope.ui.layers) != -1; });
      baselayers.sort(function(a, b){ return $.inArray(a["id"], $scope.ui.layers) - $.inArray(b["id"], $scope.ui.layers); });
      $scope.baselayers = baselayers;
    }
    else
    {
      $scope.baselayers = [];
    }

    if("featurelayers" in $scope.dashboard && $scope.dashboard.featurelayers != undefined)
    {
      var featurelayers = $.grep($scope.dashboard.featurelayers,function(x, i){ return $.inArray(x["id"], $scope.ui.layers) != -1; });
      featurelayers.sort(function(a, b){ return $.inArray(a["id"], $scope.ui.layers) - $.inArray(b["id"], $scope.ui.layers); });
      $scope.featurelayers = featurelayers;

      var visiblefeaturelayers = $.grep($scope.dashboard.featurelayers,function(x, i){
        return $.inArray(x["id"], $scope.ui.layers) != -1 &&
          $.inArray(x["id"], $scope.state.view.featurelayers) != -1;
      });
      visiblefeaturelayers.sort(function(a, b){ return $.inArray(a["id"], $scope.state.view.featurelayers) - $.inArray(b["id"], $scope.state.view.featurelayers); });
      $scope.visiblefeaturelayers = visiblefeaturelayers;

      var featureLayersWithFilters = $.grep($scope.dashboard.featurelayers, function(x, i){
        var filters = extract("filters", x);
        return Array.isArray(filters) && filters.length > 0;
      });
      featureLayersWithFilters.sort(function(a, b){
        var textA = a.title.toUpperCase();
        var textB = b.title.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
      });
      $scope.featureLayersWithFilters = featureLayersWithFilters;

      $scope.groups = [];
      for(var i = 0; i < $scope.ui.groups.length; i++)
      {
        var g = $scope.ui.groups[i];
        var layers = $.grep($scope.dashboard.featurelayers,function(x, i){ return $.inArray(x["id"], g.layers) != -1; });
        layers.sort(function(a, b){ return $.inArray(a["id"], g.layers) - $.inArray(b["id"], g.layers); });
        $scope.groups.push({
          'id': g.id,
          'label': g.label,
          'class': g.class,
          'layers': layers
        });
      }
    }
    else
    {
      $scope.featurelayers = [];
    }

  };
  $scope.updateVariables();
  $scope.$watch('state', $scope.updateVariables);

  $scope.$on("refreshMap", function(event, args) {
    if("state" in args)
    {
      $scope.state = args["state"];
      $scope.updateVariables();
      $timeout(function(){
        $scope.$digest();
      },0);
    }
  });

};

geodash.controllers.SPARCControllerModalWelcome = function($scope, $element, $controller, $interpolate)
{
  angular.extend(this, $controller('GeoDashControllerModal', {$element: $element, $scope: $scope}));

  var m = $.grep(geodash.meta.modals, function(x, i){ return x['name'] == 'sparc_welcome';})[0];
  $scope.config = m.config;
  $scope.ui = m.ui;
  $scope.showOptions = geodash.ui.showOptions;
  $scope.updateValue = geodash.util.updateValue;

  var mainScope = $element.parents(".geodash-dashboard:first").isolateScope();
  $scope.dashboard = mainScope.dashboard;
  $scope.state = mainScope.state;
  $scope.country = mainScope.state.iso3;
  $scope.hazard = mainScope.state.hazard;

  $scope.clearSelection = function(id)
  {
    $("#"+id).val(null);
    $("#"+id).typeahead("close");
  };
};

geodash.controllers.GeoDashControllerMain = function(
  $interpolate, $scope, $element, $controller,
  $http, $q,
  state, dashboard, stateschema)
{
    $scope.dashboard = dashboard;
    $scope.dashboard_flat = geodash.util.flatten($scope.dashboard);
    $scope.state = geodash.init.state({
      "state": state,
      "stateschema": stateschema,
      "dashboard": dashboard
    });
    $scope.assets = geodash.util.arrayToObject(extract("assets", $scope.dashboard));

    $scope.refreshMap = function(state){
      // Refresh all child controllers
      $scope.$broadcast("refreshMap", {'state': state});
    };

    $scope.processEvent = function(event, args)
    {
      var c = $.grep(geodash.meta.controllers, function(x, i){
        return x['name'] == 'GeoDashControllerMain';
      })[0];

      for(var i = 0; i < c.handlers.length; i++)
      {
        if(c.handlers[i]['event'] == event.name)
        {
          var handlerName = c.handlers[i]['handler'];
          if(angular.isDefined(handlerName))
          {
            var handlerFn = geodash.handlers[handlerName];
            if(angular.isDefined(handlerFn))
            {
              handlerFn($scope, $interpolate, $http, $q,  event, args);
            }
            else
            {
              geodash.log.error("handlers", "Could not find handler with name "+handlerName+".");
            }
          }
        }
      }
    };

    $.each(geodash.listeners, function(i, x){ $scope.$on(i, x); });

    var c = $.grep(geodash.meta.controllers, function(x, i){
      return x['name'] == 'GeoDashControllerMain';
    })[0];
    for(var i = 0; i < c.handlers.length; i++)
    {
      $scope.$on(c.handlers[i]['event'], $scope.processEvent);
    }
};