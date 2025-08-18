import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';

class CreateRouteScreen extends StatefulWidget {
  @override
  _CreateRouteScreenState createState() => _CreateRouteScreenState();
}

class _CreateRouteScreenState extends State<CreateRouteScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();
  final ImagePicker _picker = ImagePicker();

  String _title = '';
  String _description = '';
  double? _lat;
  double? _lng;
  File? _imageFile;
  List<LatLng> _waypoints = [];
  bool _loading = false;

  Future<void> _pickImage() async {
    final XFile? picked = await _picker.pickImage(source: ImageSource.camera);
    if (picked != null) setState(() => _imageFile = File(picked.path));
  }

  Future<void> _useCurrentLocation() async {
    final ok = await LocationService.checkPermissionAndRequest();
    if (!ok) return;
    final pos = await LocationService.getCurrentPosition();
    setState(() {
      _lat = pos.latitude;
      _lng = pos.longitude;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();
    setState(() => _loading = true);
  final waypointPayload = _waypoints.map((p) => {'lat': p.latitude, 'lng': p.longitude}).toList();
  final success = await _api.createRoute(title: _title, description: _description, lat: _lat, lng: _lng, imageFiles: _imageFile != null ? [_imageFile!] : null, waypoints: waypointPayload);
    setState(() => _loading = false);
    if (success) Navigator.of(context).pop(true); else ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error creando ruta')));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Crear ruta')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(decoration: InputDecoration(labelText: 'Título'), validator: (v) => v == null || v.isEmpty ? 'Título requerido' : null, onSaved: (v) => _title = v ?? ''),
              TextFormField(decoration: InputDecoration(labelText: 'Descripción'), maxLines: 3, onSaved: (v) => _description = v ?? ''),
              SizedBox(height: 12),
              Row(children: [
                ElevatedButton.icon(onPressed: _useCurrentLocation, icon: Icon(Icons.my_location), label: Text('Usar ubicación actual')),
                SizedBox(width: 8),
                if (_lat != null) Text('Lat: ${_lat!.toStringAsFixed(4)}'),
                Spacer(),
                ElevatedButton.icon(onPressed: () async {
                  final res = await Navigator.push(context, MaterialPageRoute(builder: (_) => _MapPickerScreen(initial: _lat != null && _lng != null ? LatLng(_lat!, _lng!) : null, waypoints: _waypoints)));
                  if (res is List<LatLng>) setState(() => _waypoints = res);
                }, icon: Icon(Icons.edit_location), label: Text('Seleccionar puntos')),
              ]),
              if (_waypoints.isNotEmpty) Padding(padding: const EdgeInsets.only(top:8.0), child: Text('Waypoints: ${_waypoints.length}')),
              SizedBox(height: 12),
              ElevatedButton.icon(onPressed: _pickImage, icon: Icon(Icons.camera_alt), label: Text('Tomar foto')),
              if (_imageFile != null) Padding(padding: const EdgeInsets.only(top:8.0), child: Image.file(_imageFile!, height: 180, fit: BoxFit.cover)),
              SizedBox(height: 16),
              _loading ? Center(child: CircularProgressIndicator()) : ElevatedButton(onPressed: _submit, child: Text('Crear'))
            ],
          ),
        ),
      ),
    );
  }
}

class _MapPickerScreen extends StatefulWidget {
  final LatLng? initial;
  final List<LatLng> waypoints;
  _MapPickerScreen({this.initial, this.waypoints = const []});

  @override
  __MapPickerScreenState createState() => __MapPickerScreenState();
}

class __MapPickerScreenState extends State<_MapPickerScreen> {
  late List<LatLng> _points;
  late CameraPosition _camera;
  final Set<Marker> _markers = {};
  final Completer<GoogleMapController> _controller = Completer();

  @override
  void initState() {
    super.initState();
    _points = List.from(widget.waypoints);
    _camera = CameraPosition(target: widget.initial ?? LatLng(40.0, -3.0), zoom: 12);
    _rebuildMarkers();
  }

  void _rebuildMarkers() {
    _markers.clear();
    for (var i = 0; i < _points.length; i++) {
      _markers.add(Marker(markerId: MarkerId('p_$i'), position: _points[i], infoWindow: InfoWindow(title: 'Punto ${i + 1}')));
    }
    setState(() {});
  }

  void _onTap(LatLng pos) {
    _points.add(pos);
    _rebuildMarkers();
  }

  void _removeLast() {
    if (_points.isNotEmpty) {
      _points.removeLast();
      _rebuildMarkers();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Seleccionar waypoints'), actions: [
        IconButton(icon: Icon(Icons.undo), onPressed: _removeLast),
        IconButton(icon: Icon(Icons.check), onPressed: () => Navigator.of(context).pop(_points)),
      ]),
      body: GoogleMap(
        initialCameraPosition: _camera,
        onTap: _onTap,
        markers: _markers,
        onMapCreated: (c) { if (!_controller.isCompleted) _controller.complete(c); },
      ),
    );
  }
}
