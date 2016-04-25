var init_map = function(opts)
{
  var map = L.map('map',
  {
    zoomControl: opt_b(opts, "zoomControl", false),
    minZoom: opt_i(opts, "minZoom", 3),
    maxZoom: opt_i(opts, "maxZoom", 18)
  });
  map.setView(
    [opt_i(opts,["latitude", "lat"],0), opt_i(opts,["longitude", "lon", "lng", "long"], 0)],
    opt_i(opts, ["zoom", "z"], 0));

  $.each(opt_j(opts, "listeners"), function(e, f){
    map.on(e, f);
  });

  return map;
};
geosite.controllers["controller_map_map"] = function(
  $rootScope, $scope, $element, $compile, $interpolate, $templateCache,
  state, popatrisk_config, context_config, map_config, live) {
  //////////////////////////////////////
  var listeners =
  {
    click: function(e) {
      var c = e.latlng;
      var delta = {
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.intend("clickedOnMap", delta, $scope);
    },
    zoomend: function(e){
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "z": live["map"].getZoom()
      };
      geosite.intend("viewChanged", delta, $scope);
    },
    dragend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.intend("viewChanged", delta, $scope);
    },
    moveend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.intend("viewChanged", delta, $scope);
    }
  };
  //////////////////////////////////////
  // The Map
  var hasViewOverride = hasHashValue(["latitude", "lat", "longitude", "lon", "lng", "zoom", "z"]);
  var view = state["view"];
  live["map"] = init_map({
    "zoomControl": map_config["controls"]["zoom"],
    "minZoom": map_config["view"]["minZoom"],
    "maxZoom": map_config["view"]["maxZoom"],
    "lat": view["lat"],
    "lon": view["lon"],
    "z": view["z"],
    "listeners": listeners
  });
  //////////////////////////////////////
  // Base Layers
  var baseLayers = geosite.layers.init_baselayers(live["map"], map_config["baselayers"]);
  $.extend(live["baselayers"], baseLayers);
  var baseLayerID = map_config["baselayers"][0].id;
  live["baselayers"][baseLayerID].addTo(live["map"]);
  geosite.intend("viewChanged", {'baselayer': baseLayerID}, $scope);
  geosite.intend("layerLoaded", {'type':'baselayer', 'layer': baseLayerID}, $scope);
  //////////////////////////////////////
  $.each(map_config.featurelayers, function(id, layerConfig){
    if(id != "popatrisk" && id != "context")
    {
      geosite.layers.init_featurelayer(id, layerConfig, $scope, live, map_config);
    }
  });
  //////////////////////////////////////
  // Feature layers
  var popatrisk_popup_content = function(source)
  {
    console.log(source);
    var f = source.feature;
    //
    var $scope = angular.element("#geosite-main").scope();
    var state = $scope.state;
    var filters = state["filters"]["popatrisk"];
    //
    //var popupTemplate = map_config["featurelayers"]["popatrisk"]["popup"]["template"];
    var popupTemplate = popup_templates["popatrisk"];
    var ctx = $.extend({}, f.properties);
    var month_short_3 = months_short_3[state["month"]-1];
    var month_long = months_long[state["month"]-1];
    ctx["month"] = month_long;
    if(state.hazard == "flood")
    {
      var rp = filters["rp"];
      ctx["popatrisk"] = f.properties["RP"+rp.toString(10)][month_short_3];
    }
    else if(state.hazard == "cyclone")
    {
      var prob_class_max = filters["prob_class_max"];
      var value = 0;
      for(var i = 0; i < f.properties.addinfo.length; i++)
      {
          var a = f.properties.addinfo[i];
          if(a["category"] == filters["category"])
          {
            if(a["prob_class_max"] != 0 && a["prob_class_max"] <= prob_class_max)
            {
              console.log("matched prob_class", prob_class_max);
              value += a[month_short_3];
            }
          }
      }
      ctx["popatrisk"] = value;
    }
    var chartConfig = map_config["featurelayers"]["popatrisk"]["popup"]["chart"];
    ctx["chartID"] = chartConfig.id;
    //Run this right after
    setTimeout(function(){
      var gc = buildGroupsAndColumnsForAdmin2(chartConfig, popatrisk_config, f.properties.admin2_code);
      var chartOptions = {
        groups: gc.groups,
        columns: gc.columns,
        bullet_width: function(d, i)
        {
          return d.id == "rp25" ? 6 : 12;
        }
      };
      buildHazardChart(chartConfig, popatrisk_config, chartOptions);
    }, 1000);
    return $interpolate(popupTemplate)(ctx);
  };
  var context_popup_content = function(source)
  {
    console.log(source);
    var fl = map_config.featurelayers.context
    var f = source.feature;
    var popupTemplate = geosite.popup.buildPopupTemplate(fl.popup, fl, f);
    var ctx = {
      'layer': fl,
      'feature': {
        'attributes': f.properties,
        'geometry': {}
      }
    };
    return $interpolate(popupTemplate)(ctx);
  };
  // Load Context Layer
  live["featurelayers"]["context"] = L.geoJson(context_config["data"]["geojson"],{
    renderOrder: $.inArray("context", map_config.renderlayers),
    style: context_config["style"]["default"],
    /* Custom */
    hoverStyle: context_config["style"]["hover"],
    /* End Custom */
    onEachFeature: function(f, layer){
      var popupOptions = {maxWidth: 300};
      //var popupContent = "Loading ..."
      layer.bindPopup(context_popup_content, popupOptions);
      layer.on({
        mouseover: highlightFeature,
        mouseout: function(e) {
          live["featurelayers"]["context"].resetStyle(e.target);
        }
      });
    }
  });
  // Load Population at Risk
  live["featurelayers"]["popatrisk"] = L.geoJson(popatrisk_config["data"]["geojson"],{
    renderOrder: $.inArray("popatrisk", map_config.renderlayers),
    style: popatrisk_config["style"]["default"],
    /* Custom */
    hoverStyle: popatrisk_config["style"]["hover"],
    /* End Custom */
    onEachFeature: function(f, layer){
      var popupOptions = {maxWidth: 300};
      //var popupContent = "Loading ..."
      layer.bindPopup(popatrisk_popup_content, popupOptions);
      layer.on({
        mouseover: highlightFeature,
        mouseout: function(e){
          live["featurelayers"]["popatrisk"].resetStyle(e.target);
        },
        click: function(e) {
          // This is handled by setting popupContent to be a function.
          //var popup = e.target.getPopup();
          //popup.update();
        }
      });
    }
  });
  geosite.layers.init_featurelayer_post(
    $scope,
    live,
    "popatrisk",
    live["featurelayers"]["popatrisk"],
    map_config.featurelayers.popatrisk.visible);
  // Zoom to Data
  if(!hasViewOverride)
  {
      live["map"].fitBounds(live["featurelayers"]["popatrisk"].getBounds());
  }
  //////////////////////////////////////
  // Sidebar Toggle
  $("#geosite-map-sidebar-toggle-left").click(function (){
    $(this).toggleClass("sidebar-open sidebar-left-open");
    $("#geosite-sidebar-left, #geosite-map").toggleClass("sidebar-open sidebar-left-open");
    setTimeout(function(){
      live["map"].invalidateSize({
        animate: true,
        pan: false
      });
    },2000);
  });
  //////////////////////////////////////
  $scope.$on("refreshMap", function(event, args) {
    // Forces Refresh
    console.log("Refreshing map...");
    // Update Visibility
    var visibleBaseLayer = args.state.view.baselayer;
    $.each(live["baselayers"], function(id, layer) {
      var visible = id == visibleBaseLayer;
      if(live["map"].hasLayer(layer) && !visible)
      {
        live["map"].removeLayer(layer)
      }
      else if((! live["map"].hasLayer(layer)) && visible)
      {
        live["map"].addLayer(layer)
      }
    });
    var visibleFeatureLayers = args.state.view.featurelayers;
    $.each(live["featurelayers"], function(id, layer) {
      var visible = $.inArray(id, visibleFeatureLayers) != -1;
      if(live["map"].hasLayer(layer) && !visible)
      {
        live["map"].removeLayer(layer)
      }
      else if((! live["map"].hasLayer(layer)) && visible)
      {
        live["map"].addLayer(layer)
      }
    });
    // Update Render Order
    var renderLayers = $.grep(layersAsArray(live["featurelayers"]), function(layer){ return $.inArray(layer["id"], visibleFeatureLayers) != -1;});
    var renderLayersSorted = sortLayers($.map(renderLayers, function(layer, i){return layer["layer"];}),true);
    var baseLayersAsArray = $.map(live["baselayers"], function(layer, id){return {'id':id,'layer':layer};});
    var baseLayers = $.map(
      $.grep(layersAsArray(live["baselayers"]), function(layer){return layer["id"] == visibleBaseLayer;}),
      function(layer, i){return layer["layer"];});
    updateRenderOrder(baseLayers.concat(renderLayersSorted));
    // Update Styles
    live["featurelayers"]["popatrisk"].setStyle(popatrisk_config["style"]["default"]);
    live["featurelayers"]["context"].setStyle(context_config["style"]["default"]);
    // Force Refresh
    setTimeout(function(){live["map"]._onResize()}, 0);
  });

  $scope.$on("changeView", function(event, args) {
    console.log("Refreshing map...");
    if(args["layer"] != undefined)
    {
      live["map"].fitBounds(live["featurelayers"][args["layer"]].getBounds());
    }
  });

  $scope.$on("openPopup", function(event, args) {
    console.log("Refreshing map...");
    if(
      args["featureLayer"] != undefined &&
      args["feature"] != undefined &&
      args["location"] != undefined)
    {
      geosite.popup.openPopup(
        $interpolate,
        args["featureLayer"],
        args["feature"],
        args["location"],
        live["map"]);
    }
  });
};