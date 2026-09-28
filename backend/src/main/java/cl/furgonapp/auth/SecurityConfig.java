package cl.furgonapp.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  SecretKeySpec secret(@Value("${app.jwt-secret}") String value) {
    if (value.length() < 32) throw new IllegalStateException(
      "JWT_SECRET debe contener al menos 32 caracteres aleatorios."
    );
    return new SecretKeySpec(
      value.getBytes(StandardCharsets.UTF_8),
      "HmacSHA256"
    );
  }

  @Bean
  JwtEncoder encoder(SecretKeySpec key) {
    return new NimbusJwtEncoder(new ImmutableSecret<>(key));
  }

  @Bean
  JwtDecoder decoder(SecretKeySpec key) {
    var d = NimbusJwtDecoder.withSecretKey(key)
      .macAlgorithm(MacAlgorithm.HS256)
      .build();
    d.setJwtValidator(JwtValidators.createDefaultWithIssuer("furgonapp"));
    return d;
  }

  @Bean
  PasswordEncoder passwords() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http) throws Exception {
    var roles = new JwtGrantedAuthoritiesConverter();
    roles.setAuthoritiesClaimName("role");
    roles.setAuthorityPrefix("ROLE_");
    var converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(roles);
    return http
      .csrf(c -> c.disable())
      .cors(c -> {})
      .sessionManagement(s ->
        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .authorizeHttpRequests(a ->
        a
          .requestMatchers("/api/auth/**", "/api/health", "/api/media/*")
          .permitAll()
          .anyRequest()
          .authenticated()
      )
      .oauth2ResourceServer(o ->
        o.jwt(j -> j.jwtAuthenticationConverter(converter))
      )
      .build();
  }

  @Bean
  CorsConfigurationSource cors(@Value("${app.cors-origin}") String origin) {
    var c = new CorsConfiguration();
    c.setAllowedOrigins(List.of(origin, "http://127.0.0.1:3000"));
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH"));
    c.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", c);
    return source;
  }
}
