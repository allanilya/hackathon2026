import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { makeStyles, tokens, Button, mergeClasses } from "@fluentui/react-components";
import { Add16Regular, ChevronDown16Regular, Chat16Regular } from "@fluentui/react-icons";
import type { Conversation } from "../types";

export interface ConversationSelectorProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "10px",
    paddingBottom: "10px",
    paddingLeft: "16px",
    paddingRight: "16px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    position: "relative",
  },
  dropdownTrigger: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    minWidth: 0,
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderRadius: "8px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: "pointer",
    fontSize: "13px",
    color: tokens.colorNeutralForeground1,
    transitionProperty: "background-color, border-color",
    transitionDuration: "0.15s",
  },
  triggerIcon: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
  },
  triggerText: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: "left",
  },
  chevron: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
    transitionProperty: "transform",
    transitionDuration: "0.2s",
  },
  chevronOpen: {
    transform: "rotate(180deg)",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: "16px",
    right: "56px",
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "12px",
    boxShadow: tokens.shadow16,
    zIndex: 100,
    maxHeight: "240px",
    overflowY: "auto",
    paddingTop: "8px",
    paddingBottom: "8px",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    paddingTop: "10px",
    paddingBottom: "10px",
    paddingLeft: "14px",
    paddingRight: "14px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "13px",
    color: tokens.colorNeutralForeground1,
    textAlign: "left",
  },
  dropdownItemActive: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  dropdownItemIcon: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
  },
  dropdownItemText: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  dropdownHeader: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    paddingTop: "8px",
    paddingBottom: "6px",
    paddingLeft: "12px",
    paddingRight: "12px",
  },
  emptyText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4,
    paddingTop: "6px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
  },
  newButton: {
    flexShrink: 0,
    minWidth: "32px",
    width: "32px",
    height: "32px",
    padding: "0",
  },
});

const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}) => {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const pastConversations = conversations.filter((c) => c.id !== activeConversationId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        className={styles.dropdownTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Chat16Regular className={styles.triggerIcon} />
        <span className={styles.triggerText}>
          {activeConversation?.title || "New Chat"}
        </span>
        <ChevronDown16Regular
          className={mergeClasses(styles.chevron, isOpen && styles.chevronOpen)}
        />
      </button>
      <Button
        className={styles.newButton}
        appearance="subtle"
        icon={<Add16Regular />}
        onClick={onNewConversation}
        title="New chat"
        size="small"
      />

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.dropdownHeader}>Past Conversations</div>
          {pastConversations.length === 0 ? (
            <div className={styles.emptyText}>No past conversations</div>
          ) : (
            pastConversations.map((conv) => (
              <button
                key={conv.id}
                className={styles.dropdownItem}
                role="option"
                aria-selected={false}
                onClick={() => {
                  onSelectConversation(conv.id);
                  setIsOpen(false);
                }}
              >
                <Chat16Regular className={styles.dropdownItemIcon} />
                <span className={styles.dropdownItemText}>{conv.title}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationSelector;
