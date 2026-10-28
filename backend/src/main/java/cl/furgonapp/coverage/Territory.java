package cl.furgonapp.coverage;

import cl.furgonapp.shared.ApiException;
import java.util.List;

/** Small, local geographic polygons. Boundary pickup points count as covered. */
public final class Territory {
  private static double cross(GeoPoint a, GeoPoint b, GeoPoint c) {
    return (b.longitude-a.longitude)*(c.latitude-a.latitude)-(b.latitude-a.latitude)*(c.longitude-a.longitude);
  }
  private static boolean onSegment(GeoPoint a, GeoPoint b, GeoPoint p) {
    return Math.abs(cross(a,b,p)) < 1e-10 && p.longitude >= Math.min(a.longitude,b.longitude)-1e-10 && p.longitude <= Math.max(a.longitude,b.longitude)+1e-10 && p.latitude >= Math.min(a.latitude,b.latitude)-1e-10 && p.latitude <= Math.max(a.latitude,b.latitude)+1e-10;
  }
  public static boolean contains(List<GeoPoint> polygon, Double latitude, Double longitude) {
    if (latitude == null || longitude == null || !Double.isFinite(latitude) || !Double.isFinite(longitude) || polygon.size() < 3) return false;
    var point = new GeoPoint(latitude, longitude);
    boolean inside = false;
    for (int i=0,j=polygon.size()-1;i<polygon.size();j=i++) {
      var a=polygon.get(j); var b=polygon.get(i);
      if(onSegment(a,b,point)) return true;
      if((a.latitude>latitude)!=(b.latitude>latitude) && longitude < (b.longitude-a.longitude)*(latitude-a.latitude)/(b.latitude-a.latitude)+a.longitude) inside=!inside;
    }
    return inside;
  }
  public static void validate(List<GeoPoint> points) {
    if(points == null || points.size()<3 || points.size()>100) throw ApiException.bad("Dibuja una zona de entre 3 y 100 puntos.");
    double area=0;
    for(int i=0;i<points.size();i++) {
      var a=points.get(i); var b=points.get((i+1)%points.size());
      if(!Double.isFinite(a.latitude)||!Double.isFinite(a.longitude)||Math.abs(a.latitude)>90||Math.abs(a.longitude)>180) throw ApiException.bad("La zona contiene coordenadas inválidas.");
      if(a.latitude==b.latitude && a.longitude==b.longitude) throw ApiException.bad("Elimina los puntos repetidos de la zona.");
      area += a.longitude*b.latitude-b.longitude*a.latitude;
      for(int j=i+1;j<points.size();j++) {
        if(j==i+1 || (i==0 && j==points.size()-1)) continue;
        var c=points.get(j);var d=points.get((j+1)%points.size());
        if(onSegment(a,b,c)||onSegment(a,b,d)||onSegment(c,d,a)||onSegment(c,d,b)||(cross(a,b,c)*cross(a,b,d)<0 && cross(c,d,a)*cross(c,d,b)<0)) throw ApiException.bad("Los bordes de la zona no pueden cruzarse. Ajusta los puntos del mapa.");
      }
    }
    if(Math.abs(area)<1e-10) throw ApiException.bad("La zona debe encerrar un área; separa los puntos del mapa.");
  }
}
