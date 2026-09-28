package cl.furgonapp.auth;

import cl.furgonapp.users.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.bootstrap.enabled", havingValue = "true")
public class InitialAccounts implements CommandLineRunner {

  private final AccountService accounts;
  private final UserRepository users;
  private final Environment environment;

  public InitialAccounts(
    AccountService accounts,
    UserRepository users,
    Environment environment
  ) {
    this.accounts = accounts;
    this.users = users;
    this.environment = environment;
  }

  @Override
  @Transactional
  public void run(String... args) {
    // Bootstrap only an empty installation; never reset or recreate existing users.
    if (users.count() != 0) return;
    for (Role role : Role.values()) {
      String name = role.name().toLowerCase(java.util.Locale.ROOT);
      String password = environment.getRequiredProperty(
        "app.bootstrap." + name + "-password"
      );
      accounts.create(
        new AccountService.Registration(
          name + "@furgonapp.local",
          password,
          name.substring(0, 1).toUpperCase() + name.substring(1),
          "Inicial",
          role
        )
      );
    }
  }
}
