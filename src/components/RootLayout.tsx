import { AppShell, Button, Group, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { IconDownload, IconBoxPadding, IconHammer } from "@tabler/icons-react";

import { useInstallPrompt, precacheAssets } from "@/lib/pwa";
import { collectAssetUrls, useProjects } from "@/lib/projects";

type Props = {
  children: ReactNode;
};

/**
 * Sticky app header + main content slot. Not a full AppShell since the
 * original UI uses a plain single-column layout — we just keep the
 * Mantine-friendly structure.
 */
export function RootLayout({ children }: Props) {
  const { data: projects } = useProjects();
  const { canInstall, install } = useInstallPrompt();

  const handleSaveOffline = async () => {
    if (!projects) return;
    const urls = collectAssetUrls(projects);
    await precacheAssets(urls);
  };

  return (
    <AppShell header={{ height: 64 }} padding={0}>
      <AppShell.Header
        style={{
          background: "rgba(246,244,238,0.88)",
          backdropFilter: "saturate(140%) blur(10px)",
          borderBottom: "1px solid var(--ws-border-soft)",
        }}
      >
        <Group h="100%" px="md" justify="space-between" wrap="nowrap" gap="xs">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Group gap="xs">
              <IconHammer size={22} color="var(--ws-accent)" />
              <Text fw={700} size="lg" lts="-0.01em">
                Workshop
              </Text>
              {projects && (
                <Text c="dimmed" size="sm" visibleFrom="xs">
                  {projects.length} projects
                </Text>
              )}
            </Group>
          </Link>
          <Group gap="xs" wrap="nowrap">
            <Button
              component={Link}
              to="/cut-list"
              variant="default"
              leftSection={<IconBoxPadding size={16} />}
              size="sm"
            >
              Cut list
            </Button>
            {"serviceWorker" in navigator && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveOffline}
                leftSection={<IconDownload size={16} />}
              >
                Save offline
              </Button>
            )}
            {canInstall && (
              <Button variant="filled" size="sm" onClick={install}>
                Install app
              </Button>
            )}
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
