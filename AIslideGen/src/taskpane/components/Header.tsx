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
  Avatar,
} from "@fluentui/react-components";
import { SignOut20Regular, Premium20Regular } from "@fluentui/react-icons";
import type { User } from "@supabase/supabase-js";

export interface HeaderProps {
  title: string;
  logo: string;
  user?: User | null;
  onSignOut?: () => void;
}

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingTop: "16px",
    paddingBottom: "12px",
    paddingLeft: "20px",
    paddingRight: "20px",
    backgroundColor: tokens.colorNeutralBackground3,
    justifyContent: "space-between",
  },
  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  textGroup: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    margin: "0",
    lineHeight: tokens.lineHeightBase500,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    margin: "0",
  },
  profileButton: {
    cursor: "pointer",
  },
});

const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  const { title, logo, user, onSignOut } = props;
  const styles = useStyles();

  const getInitials = (email: string | undefined): string => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

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
            <Avatar
              className={styles.profileButton}
              name={user.email}
              size={32}
              initials={getInitials(user.email)}
              color="colorful"
            />
          </MenuTrigger>

          <MenuPopover>
            <MenuList>
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
