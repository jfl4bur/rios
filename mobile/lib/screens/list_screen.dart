import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../models/route_model.dart';
import 'detail_screen.dart';

class RutasListScreen extends StatefulWidget {
  @override
  _RutasListScreenState createState() => _RutasListScreenState();
}

class _RutasListScreenState extends State<RutasListScreen> {
  final ApiService _api = ApiService();
  late Future<List<RouteModel>> _future;
  final Completer<GoogleMapController> _mapController = Completer();
  bool _showMap = false;
  Set<Marker> _markers = {};
  List<RouteModel> _routes = [];
  LatLng? _userLocation;

  static const CameraPosition _defaultCamera = CameraPosition(target: LatLng(40.0, -3.0), zoom: 6);

  @override
  void initState() {
    super.initState();
    _future = _loadRoutes();
  }

  Future<List<RouteModel>> _loadRoutes() async {
    final list = await _api.fetchRoutes();
    _routes = list;
    _buildMarkers();
    return list;
  }

  void _buildMarkers() {
    final markers = <Marker>{};
    for (var r in _routes) {
      if (r.lat != null && r.lng != null) {
        markers.add(Marker(
          markerId: MarkerId(r.id.toString()),
          position: LatLng(r.lat!, r.lng!),
          infoWindow: InfoWindow(title: r.title, snippet: r.description, onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => DetailScreen(route: r)));
          }),
        ));
      }
    }
    setState(() {
      _markers = markers;
    });
  }

  void _toggleView() {
    setState(() {
      _showMap = !_showMap;
    });
    if (_showMap && _markers.isNotEmpty) {
      // center map on first marker
      final first = _markers.first.position;
      _moveCamera(LatLng(first.latitude, first.longitude));
    }
  }

  Future<void> _centerOnUser() async {
    final ok = await LocationService.checkPermissionAndRequest();
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Permiso de ubicación no concedido')));
      return;
    }
    final pos = await LocationService.getCurrentPosition();
    _userLocation = LatLng(pos.latitude, pos.longitude);
    _moveCamera(_userLocation!);
  }

  Future<void> _moveCamera(LatLng target) async {
    final controller = await _mapController.future;
    controller.animateCamera(CameraUpdate.newCameraPosition(CameraPosition(target: target, zoom: 14)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Rutas & Ríos'),
        actions: [
          IconButton(
            icon: Icon(_showMap ? Icons.list : Icons.map),
            tooltip: _showMap ? 'Ver lista' : 'Ver mapa',
            onPressed: _toggleView,
          ),
          IconButton(
            icon: Icon(Icons.add_location_alt),
            tooltip: 'Crear ruta',
            onPressed: () async {
              final res = await Navigator.push(context, MaterialPageRoute(builder: (_) => CreateRouteScreen()));
              if (res == true) {
                // refresh
                setState(() {
                  _future = _loadRoutes();
                });
              }
            },
          )
        ],
      ),
      body: FutureBuilder<List<RouteModel>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return Center(child: CircularProgressIndicator());
          if (snapshot.hasError) return Center(child: Text('Error al cargar rutas'));
          final routes = snapshot.data ?? [];
          if (_showMap) {
            return _buildMapView(routes);
          }
          return _buildListView(routes);
        },
      ),
    );
  }

  Widget _buildListView(List<RouteModel> routes) {
    if (routes.isEmpty) return Center(child: Text('No hay rutas disponibles'));
    return ListView.builder(
      itemCount: routes.length,
      itemBuilder: (context, i) {
        final r = routes[i];
        return ListTile(
          title: Text(r.title),
          subtitle: Text(r.description, maxLines: 1, overflow: TextOverflow.ellipsis),
          trailing: Icon(Icons.chevron_right),
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => DetailScreen(route: r))),
        );
      },
    );
  }

  Widget _buildMapView(List<RouteModel> routes) {
    if (_markers.isEmpty) {
      // No markers, show placeholder
      return Center(child: Text('No hay coordenadas disponibles para mostrar en el mapa.'));
    }
    return GoogleMap(
      initialCameraPosition: CameraPosition(target: _markers.first.position, zoom: 12),
      markers: _markers,
      onMapCreated: (GoogleMapController controller) {
        if (!_mapController.isCompleted) _mapController.complete(controller);
      },
      myLocationEnabled: false,
      zoomControlsEnabled: true,
    );
  }
}
