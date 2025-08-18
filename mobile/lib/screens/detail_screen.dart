import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/route_model.dart';
import '../services/location_service.dart';

class DetailScreen extends StatefulWidget {
  final RouteModel route;
  DetailScreen({required this.route});

  @override
  _DetailScreenState createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  final Completer<GoogleMapController> _controller = Completer();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(route.title)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(route.title, style: Theme.of(context).textTheme.headline6),
            SizedBox(height: 8),
            Text(route.description),
            SizedBox(height: 16),
            if (widget.route.lat != null && widget.route.lng != null)
              Expanded(
                child: Stack(
                  children: [
                    GoogleMap(
                      initialCameraPosition: CameraPosition(target: LatLng(widget.route.lat!, widget.route.lng!), zoom: 14),
                      markers: {
                        Marker(markerId: MarkerId(widget.route.id.toString()), position: LatLng(widget.route.lat!, widget.route.lng!))
                      },
                      onMapCreated: (GoogleMapController controller) {
                        if (!_controller.isCompleted) _controller.complete(controller);
                      },
                    ),
                    Positioned(
                      right: 16,
                      bottom: 16,
                      child: FloatingActionButton(
                        mini: true,
                        child: Icon(Icons.my_location),
                        onPressed: () async {
                          final ok = await LocationService.checkPermissionAndRequest();
                          if (!ok) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Permiso de ubicación no concedido')));
                            return;
                          }
                          final pos = await LocationService.getCurrentPosition();
                          final controller = await _controller.future;
                          controller.animateCamera(CameraUpdate.newLatLng(LatLng(pos.latitude, pos.longitude)));
                        },
                      ),
                    )
                  ],
                ),
              )
            else
              Text('Sin coordenadas para mostrar en el mapa.'),
          ],
        ),
      ),
    );
  }
}
