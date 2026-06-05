<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-4 pr-8 text-left">
          <img
            :src="appIconUrl"
            alt=""
            class="size-14 shrink-0 border bg-muted"
            aria-hidden="true"
          />
          <div class="min-w-0 space-y-1">
            <DialogTitle class="text-2xl">Neanes</DialogTitle>
            <DialogDescription>
              {{ $t(($) => $.dialog.about.description, { ns: 'dialog' }) }}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="grid gap-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <Card size="sm" class="bg-secondary">
            <CardContent>
              <div class="text-xs font-medium text-muted-foreground">
                {{ $t(($) => $.dialog.about.version, { ns: 'dialog' }) }}
              </div>
              <Badge variant="outline" class="mt-2">v{{ appVersion }}</Badge>
            </CardContent>
          </Card>
          <Card size="sm" class="bg-secondary">
            <CardContent>
              <div class="text-xs font-medium text-muted-foreground">
                {{ $t(($) => $.dialog.about.platform, { ns: 'dialog' }) }}
              </div>
              <div class="mt-2 text-sm font-medium">
                {{
                  isDesktop
                    ? $t(($) => $.dialog.about.desktop, { ns: 'dialog' })
                    : $t(($) => $.dialog.about.web, { ns: 'dialog' })
                }}
              </div>
            </CardContent>
          </Card>
          <Card size="sm" class="bg-secondary">
            <CardContent>
              <div class="text-xs font-medium text-muted-foreground">
                {{ $t(($) => $.dialog.about.license, { ns: 'dialog' }) }}
              </div>
              <div class="mt-2 text-sm font-medium">GPL-3.0-only</div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <section class="space-y-2">
          <h3 class="text-sm font-medium">
            {{ $t(($) => $.dialog.about.project, { ns: 'dialog' }) }}
          </h3>
          <p class="text-sm leading-6 text-muted-foreground">
            {{ $t(($) => $.dialog.about.projectDescription, { ns: 'dialog' }) }}
          </p>
        </section>

        <div class="flex flex-wrap gap-2">
          <Button
            variant="outline"
            type="button"
            @click="openExternal(guideUrl)"
          >
            <BookOpen />
            {{ $t(($) => $.dialog.about.guide, { ns: 'dialog' }) }}
          </Button>
          <Button
            variant="outline"
            type="button"
            @click="openExternal(repoUrl)"
          >
            <Code2 />
            {{ $t(($) => $.dialog.about.sourceCode, { ns: 'dialog' }) }}
          </Button>
          <Button
            variant="outline"
            type="button"
            @click="openExternal(issuesUrl)"
          >
            <Lightbulb />
            {{ $t(($) => $.dialog.about.requestFeature, { ns: 'dialog' }) }}
          </Button>
          <Button
            variant="outline"
            type="button"
            @click="openExternal(issuesUrl)"
          >
            <Bug />
            {{ $t(($) => $.dialog.about.reportIssue, { ns: 'dialog' }) }}
          </Button>
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" type="button">
            {{ $t(($) => $.dialog.about.close, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { BookOpen, Bug, Code2, Lightbulb } from '@lucide/vue';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { isElectron } from '@/utils/isElectron';

const open = defineModel<boolean>('open', { required: true });

const appVersion = APP_VERSION;
const appIconUrl = `${import.meta.env.BASE_URL}assets/icons/icon-512x512.png`;
const isDesktop = isElectron();
const guideUrl = import.meta.env.VITE_GUIDE_URL;
const issuesUrl = import.meta.env.VITE_ISSUES_URL;
const repoUrl = 'https://github.com/neanes/neanes';

function openExternal(url: string) {
  const externalWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (externalWindow) {
    externalWindow.opener = null;
  }
}
</script>
