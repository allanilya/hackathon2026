import * as React from "react";
import {
  Image,
  tokens,
  makeStyles,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
} from "@fluentui/react-components";
import { SignOut20Regular, Premium20Regular, Person20Regular, WeatherMoon20Regular, WeatherSunny20Regular } from "@fluentui/react-icons";
import type { User } from "@supabase/supabase-js";

export interface HeaderProps {
  title: string;
  logo: string;
  user?: User | null;
  onSignOut?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingTop: "20px",
    paddingBottom: "16px",
    paddingLeft: "24px",
    paddingRight: "24px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    justifyContent: "space-between",
  },
  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  textGroup: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: "20px",
    fontWeight: tokens.fontWeightSemibold,
    margin: "0",
    lineHeight: "1.2",
    color: tokens.colorNeutralForeground1,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    margin: "0",
    marginTop: "2px",
  },
  profileButton: {
    cursor: "pointer",
  },
});

const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  const { title, logo, user, onSignOut, isDarkMode, onToggleTheme } = props;
  const styles = useStyles();

  const handleSubscriptionClick = () => {
    window.open("https://billing.stripe.com/p/login/test_00000000000000", "_blank");
  };

  return (
    <section className={styles.header}>
      <div className={styles.leftGroup}>
        <Image width="36" height="36" src={logo} alt={title} />
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Slider</h1>
          <p className={styles.subtitle}>Slide creation made simple</p>
        </div>
      </div>

      {user && (
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              className={styles.profileButton}
              appearance="subtle"
              icon={<Person20Regular />}
              size="small"
            />
          </MenuTrigger>

          <MenuPopover>
            <MenuList>
              {onToggleTheme && (
                <MenuItem
                  icon={isDarkMode ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
                  onClick={onToggleTheme}
                >
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </MenuItem>
              )}
              <MenuItem icon={<Premium20Regular />} onClick={handleSubscriptionClick}>
                View Subscription
              </MenuItem>
              <MenuItem icon={<SignOut20Regular />} onClick={onSignOut}>
                Sign Out
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      )}
    </section>
  );
};

export default Header;
