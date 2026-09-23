package cl.furgonapp.users;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {
  java.util.Optional<User> findByEmailIgnoreCase(String email);
  java.util.List<User> findByRole(Role role);
}
