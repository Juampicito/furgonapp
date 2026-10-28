package cl.furgonapp;
import cl.furgonapp.coverage.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class TerritoryTest {
  List<GeoPoint> square = List.of(new GeoPoint(-33.5,-70.61),new GeoPoint(-33.5,-70.59),new GeoPoint(-33.48,-70.59),new GeoPoint(-33.48,-70.61));
  @Test void includesInteriorAndBoundaryButNotOtherAddressesInSameCommune() {
    Territory.validate(square);
    assertThat(Territory.contains(square,-33.49,-70.60)).isTrue();
    assertThat(Territory.contains(square,-33.5,-70.60)).isTrue();
    assertThat(Territory.contains(square,-33.5,-70.61)).isTrue();
    assertThat(Territory.contains(square,-33.47,-70.60)).isFalse();
    assertThat(Territory.contains(square,null,null)).isFalse();
  }
  @Test void rejectsCrossedDegenerateAndInvalidPolygons() {
    assertThatThrownBy(() -> Territory.validate(List.of(square.get(0),square.get(2),square.get(1),square.get(3)))).isInstanceOf(RuntimeException.class);
    assertThatThrownBy(() -> Territory.validate(List.of(new GeoPoint(1,1),new GeoPoint(2,2),new GeoPoint(3,3)))).isInstanceOf(RuntimeException.class);
    assertThatThrownBy(() -> Territory.validate(List.of(square.get(0),square.get(0),square.get(1)))).isInstanceOf(RuntimeException.class);
    assertThatThrownBy(() -> Territory.validate(List.of(new GeoPoint(Double.NaN,1),square.get(1),square.get(2)))).isInstanceOf(RuntimeException.class);
  }
  @Test void respectsConcaveIndentation() {
    var concave=List.of(new GeoPoint(0,0),new GeoPoint(0,4),new GeoPoint(4,4),new GeoPoint(2,2),new GeoPoint(4,0));
    Territory.validate(concave);
    assertThat(Territory.contains(concave,1.0,2.0)).isTrue();
    assertThat(Territory.contains(concave,3.0,2.0)).isFalse();
  }
}
