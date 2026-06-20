<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[42rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden sm:max-w-3xl"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.pageSetup.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t(($) => $.dialog.pageSetup.description, { ns: 'dialog' }) }}
        </DialogDescription>
      </DialogHeader>

      <form
        id="page-setup-form"
        class="contents"
        @submit.prevent="updatePageSetup"
      >
        <Tabs
          default-value="pageSize"
          orientation="vertical"
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden sm:grid-cols-[13rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)]"
        >
          <ScrollArea class="col-start-1 row-start-1 min-h-0">
            <TabsList
              class="h-auto w-full flex-col items-stretch justify-start p-1"
            >
              <TabsTrigger
                v-for="section in sections"
                :key="section.value"
                :value="section.value"
                class="min-h-9 w-full flex-none justify-start whitespace-normal text-left"
              >
                <component :is="section.icon" />
                {{ $t(section.labelSelector, { ns: 'dialog' }) }}
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent
            v-for="section in sections"
            :key="section.value"
            :value="section.value"
            class="col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden sm:col-start-2 sm:row-start-1"
          >
            <ScrollArea class="h-full min-h-0 border">
              <FieldGroup class="p-4">
                <template v-if="section.value === 'pageSize'">
                  <Field orientation="horizontal">
                    <FieldLabel for="page-setup-dialog-paper-size">
                      {{
                        $t(($) => $.dialog.pageSetup.paperSize, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLabel>
                    <Select v-model="pageSize">
                      <SelectTrigger id="page-setup-dialog-paper-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem
                            v-for="size in pageSizes"
                            :key="size.name"
                            :value="size.name"
                          >
                            {{ size.name }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <FieldGroup
                    v-if="form.pageSize === 'Custom'"
                    class="grid gap-4 sm:grid-cols-2"
                  >
                    <Field orientation="horizontal">
                      <FieldLabel for="page-setup-dialog-custom-width">
                        {{
                          $t(($) => $.dialog.pageSetup.width, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <div class="flex items-center gap-2">
                        <InputUnit
                          id="page-setup-dialog-custom-width"
                          v-model="form.pageWidthCustom"
                          :unit="form.pageSizeUnit"
                          :min="1"
                          :max="10000"
                          :step="marginStep"
                          :format-options="fraction2FormatOptions"
                          @update:model-value="updatePageSize"
                        />
                        <span class="text-xs text-muted-foreground">
                          {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                        </span>
                      </div>
                    </Field>

                    <Field orientation="horizontal">
                      <FieldLabel for="page-setup-dialog-custom-height">
                        {{
                          $t(($) => $.dialog.pageSetup.height, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <div class="flex items-center gap-2">
                        <InputUnit
                          id="page-setup-dialog-custom-height"
                          v-model="form.pageHeightCustom"
                          :unit="form.pageSizeUnit"
                          :min="1"
                          :max="10000"
                          :step="marginStep"
                          :format-options="fraction2FormatOptions"
                          @update:model-value="updatePageSize"
                        />
                        <span class="text-xs text-muted-foreground">
                          {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                        </span>
                      </div>
                    </Field>
                  </FieldGroup>

                  <Field orientation="horizontal">
                    <FieldLabel>
                      {{
                        $t(($) => $.dialog.pageSetup.orientation, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLabel>
                    <ToggleGroup
                      v-model="orientation"
                      type="single"
                      variant="outline"
                    >
                      <ToggleGroupItem value="portrait">
                        {{
                          $t(($) => $.dialog.pageSetup.portrait, {
                            ns: 'dialog',
                          })
                        }}
                      </ToggleGroupItem>
                      <ToggleGroupItem value="landscape">
                        {{
                          $t(($) => $.dialog.pageSetup.landscape, {
                            ns: 'dialog',
                          })
                        }}
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel for="page-setup-dialog-unit">
                        {{
                          $t(($) => $.dialog.pageSetup.unit, { ns: 'dialog' })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(($) => $.dialog.pageSetup.unitDescription, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <Select v-model="form.pageSizeUnit">
                      <SelectTrigger id="page-setup-dialog-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem
                            v-for="unit in pageSizeUnitOptions"
                            :key="unit.value"
                            :value="unit.value"
                          >
                            {{ $t(unit.labelSelector, { ns: 'dialog' }) }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </template>

                <template v-else-if="section.value === 'margins'">
                  <Field
                    v-for="row in marginRows"
                    :key="row.id"
                    orientation="horizontal"
                  >
                    <FieldLabel :for="row.id">
                      {{ $t(row.labelSelector, { ns: 'dialog' }) }}
                    </FieldLabel>
                    <div class="flex items-center gap-2">
                      <InputUnit
                        :id="row.id"
                        :model-value="form[row.modelKey]"
                        :unit="form.pageSizeUnit"
                        :min="0"
                        :max="row.max.value"
                        :step="marginStep"
                        :format-options="fraction2FormatOptions"
                        @update:model-value="row.update"
                      />
                      <span class="text-xs text-muted-foreground">
                        {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                      </span>
                    </div>
                  </Field>
                </template>

                <template v-else-if="section.value === 'spacing'">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel for="page-setup-dialog-neume-spacing">
                        {{
                          $t(($) => $.dialog.pageSetup.neumeSpacing, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) => $.dialog.pageSetup.neumeSpacingDescription,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <div class="flex items-center gap-2">
                      <InputUnit
                        id="page-setup-dialog-neume-spacing"
                        v-model="form.neumeDefaultSpacing"
                        :unit="form.pageSizeUnit"
                        :min="-neumeSpacingMax"
                        :max="neumeSpacingMax"
                        :step="spacingStep"
                        :format-options="fraction3FormatOptions"
                      />
                      <span class="text-xs text-muted-foreground">
                        {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                      </span>
                    </div>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel
                        for="page-setup-dialog-martyria-vertical-offset"
                      >
                        {{
                          $t(($) => $.dialog.pageSetup.martyriaVerticalOffset, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) =>
                              $.dialog.pageSetup
                                .martyriaVerticalOffsetDescription,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <div class="flex items-center gap-2">
                      <InputUnit
                        id="page-setup-dialog-martyria-vertical-offset"
                        v-model="form.martyriaVerticalOffset"
                        :unit="form.pageSizeUnit"
                        :min="-neumeSpacingMax"
                        :max="neumeSpacingMax"
                        :step="spacingStep"
                        :format-options="fraction3FormatOptions"
                      />
                      <span class="text-xs text-muted-foreground">
                        {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                      </span>
                    </div>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel
                        for="page-setup-dialog-lyrics-vertical-offset"
                      >
                        {{
                          $t(($) => $.dialog.pageSetup.lyricsV, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(($) => $.dialog.pageSetup.lyricsVDescription, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <div class="flex items-center gap-2">
                      <InputUnit
                        id="page-setup-dialog-lyrics-vertical-offset"
                        :model-value="form.lyricsVerticalOffset"
                        :unit="form.pageSizeUnit"
                        :max="lyricsVerticalOffsetMax"
                        :step="spacingStep"
                        :format-options="fraction3FormatOptions"
                        @update:model-value="updateLyricsVerticalOffset"
                      />
                      <span class="text-xs text-muted-foreground">
                        {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                      </span>
                    </div>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel
                        for="page-setup-dialog-lyrics-minimum-spacing"
                      >
                        {{
                          $t(($) => $.dialog.pageSetup.lyricsH, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(($) => $.dialog.pageSetup.lyricsHDescription, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <div class="flex items-center gap-2">
                      <InputUnit
                        id="page-setup-dialog-lyrics-minimum-spacing"
                        :model-value="form.lyricsMinimumSpacing"
                        :unit="form.pageSizeUnit"
                        :max="lyricsMinimumSpacingMax"
                        :step="spacingStep"
                        :format-options="fraction3FormatOptions"
                        @update:model-value="updateLyricsMinimumSpacing"
                      />
                      <span class="text-xs text-muted-foreground">
                        {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                      </span>
                    </div>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel for="page-setup-dialog-hyphen-spacing">
                        {{
                          $t(($) => $.dialog.pageSetup.hyphens, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) => $.dialog.pageSetup.hyphenSpacingDescription,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <div class="flex items-center gap-2">
                      <InputUnit
                        id="page-setup-dialog-hyphen-spacing"
                        :model-value="form.hyphenSpacing"
                        :unit="form.pageSizeUnit"
                        :min="0"
                        :max="hyphenSpacingMax"
                        :step="spacingStep"
                        :format-options="fraction3FormatOptions"
                        @update:model-value="updateHyphenSpacing"
                      />
                      <span class="text-xs text-muted-foreground">
                        {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                      </span>
                    </div>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel for="page-setup-dialog-hyphen-clearance">
                        {{
                          $t(
                            ($) =>
                              $.dialog.pageSetup
                                .minimumSyllableToHyphenClearance,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) =>
                              $.dialog.pageSetup
                                .minimumSyllableToHyphenClearanceDescription,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <div class="flex items-center gap-2">
                      <InputUnit
                        id="page-setup-dialog-hyphen-clearance"
                        :model-value="form.minimumSyllableToHyphenClearance"
                        :unit="form.pageSizeUnit"
                        :min="0"
                        :max="minimumSyllableToHyphenClearanceMax"
                        :step="spacingStep"
                        :format-options="fraction3FormatOptions"
                        @update:model-value="
                          updateMinimumSyllableToHyphenClearance
                        "
                      />
                      <span class="text-xs text-muted-foreground">
                        {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                      </span>
                    </div>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel for="page-setup-dialog-line-height">
                        {{
                          $t(($) => $.dialog.pageSetup.line, { ns: 'dialog' })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(($) => $.dialog.pageSetup.lineSpacingDescription, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <div class="flex items-center gap-2">
                      <InputUnit
                        id="page-setup-dialog-line-height"
                        :model-value="form.lineHeight"
                        :unit="form.pageSizeUnit"
                        :min="0"
                        :max="lineHeightMax"
                        :step="spacingStep"
                        :format-options="fraction3FormatOptions"
                        @update:model-value="updateLineHeight"
                      />
                      <span class="text-xs text-muted-foreground">
                        {{ $t(marginUnitLabel!, { ns: 'dialog' }) }}
                      </span>
                    </div>
                  </Field>
                </template>

                <template v-else-if="section.value === 'headersAndFooters'">
                  <Field
                    v-for="row in headerFooterCheckboxRows"
                    :key="row.id"
                    orientation="horizontal"
                  >
                    <Checkbox
                      :id="row.id"
                      :model-value="form[row.modelKey]"
                      @update:model-value="setBoolean(row.modelKey, $event)"
                    />
                    <FieldLabel :for="row.id">
                      {{ $t(row.labelSelector, { ns: 'dialog' }) }}
                    </FieldLabel>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel for="page-setup-dialog-first-page-number">
                        {{
                          $t(($) => $.dialog.pageSetup.firstPageNumber, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) =>
                              $.dialog.pageSetup.firstPageNumberDescription,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <InputUnit
                      id="page-setup-dialog-first-page-number"
                      v-model="form.firstPageNumber"
                      unit="unitless"
                      :step="1"
                      :format-options="fraction0FormatOptions"
                      :default-value="1"
                    />
                  </Field>

                  <FieldSet>
                    <FieldLegend variant="label">
                      {{
                        $t(($) => $.dialog.pageSetup.headerHorizontalRule, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLegend>
                    <FieldGroup>
                      <Field orientation="horizontal">
                        <Checkbox
                          id="page-setup-dialog-header-hr"
                          :model-value="form.showHeaderHorizontalRule"
                          @update:model-value="
                            form.showHeaderHorizontalRule = $event === true
                          "
                        />
                        <FieldContent>
                          <FieldLabel for="page-setup-dialog-header-hr">
                            {{
                              $t(
                                ($) =>
                                  $.dialog.pageSetup
                                    .showHeaderHorizontalRuleDescription,
                                {
                                  ns: 'dialog',
                                },
                              )
                            }}
                          </FieldLabel>
                        </FieldContent>
                      </Field>

                      <template v-if="form.showHeaderHorizontalRule">
                        <FieldGroup class="grid gap-4 sm:grid-cols-3">
                          <Field orientation="horizontal">
                            <FieldLabel>
                              {{
                                $t(($) => $.dialog.pageSetup.color, {
                                  ns: 'dialog',
                                })
                              }}
                            </FieldLabel>
                            <ColorPicker
                              v-model="form.headerHorizontalRuleColor"
                            />
                          </Field>
                          <Field orientation="horizontal">
                            <FieldLabel>
                              {{
                                $t(($) => $.dialog.pageSetup.thickness, {
                                  ns: 'dialog',
                                })
                              }}
                            </FieldLabel>
                            <InputUnit
                              v-model="form.headerHorizontalRuleThickness"
                              unit="pt"
                              :min="0"
                              :max="100"
                              :step="0.5"
                              :format-options="fraction1FormatOptions"
                            />
                          </Field>
                          <Field orientation="horizontal">
                            <FieldLabel>
                              {{
                                $t(($) => $.dialog.pageSetup.marginTop, {
                                  ns: 'dialog',
                                })
                              }}
                            </FieldLabel>
                            <InputUnit
                              v-model="form.headerHorizontalRuleMarginTop"
                              unit="pt"
                              :min="0"
                              :max="1000"
                              :step="0.5"
                              :format-options="fraction1FormatOptions"
                            />
                          </Field>
                          <Field orientation="horizontal">
                            <FieldLabel>
                              {{
                                $t(($) => $.dialog.pageSetup.marginBottom, {
                                  ns: 'dialog',
                                })
                              }}
                            </FieldLabel>
                            <InputUnit
                              v-model="form.headerHorizontalRuleMarginBottom"
                              unit="pt"
                              :min="0"
                              :max="1000"
                              :step="0.5"
                              :format-options="fraction1FormatOptions"
                            />
                          </Field>
                        </FieldGroup>

                        <Field
                          v-if="form.headerDifferentFirstPage"
                          orientation="horizontal"
                        >
                          <Checkbox
                            id="page-setup-dialog-header-excludeHeaderHorizontalRuleFirstPage"
                            :model-value="
                              form.excludeHeaderHorizontalRuleFirstPage
                            "
                            @update:model-value="
                              form.excludeHeaderHorizontalRuleFirstPage =
                                $event === true
                            "
                          />
                          <FieldLabel
                            for="page-setup-dialog-header-excludeHeaderHorizontalRuleFirstPage"
                          >
                            {{
                              $t(
                                ($) =>
                                  $.dialog.pageSetup
                                    .excludeHorizontalRuleFirstPageDescription,
                                { ns: 'dialog' },
                              )
                            }}
                          </FieldLabel>
                        </Field>

                        <template v-if="form.headerDifferentOddEven">
                          <Field orientation="horizontal">
                            <Checkbox
                              id="page-setup-dialog-header-excludeHeaderHorizontalRuleOddPage"
                              :model-value="
                                form.excludeHeaderHorizontalRuleOddPage
                              "
                              @update:model-value="
                                form.excludeHeaderHorizontalRuleOddPage =
                                  $event === true
                              "
                            />
                            <FieldLabel
                              for="page-setup-dialog-header-excludeHeaderHorizontalRuleOddPage"
                            >
                              {{
                                $t(
                                  ($) =>
                                    $.dialog.pageSetup
                                      .excludeHorizontalRuleOddPageDescription,
                                  { ns: 'dialog' },
                                )
                              }}
                            </FieldLabel>
                          </Field>
                          <Field orientation="horizontal">
                            <Checkbox
                              id="page-setup-dialog-header-excludeHeaderHorizontalRuleEvenPage"
                              :model-value="
                                form.excludeHeaderHorizontalRuleEvenPage
                              "
                              @update:model-value="
                                form.excludeHeaderHorizontalRuleEvenPage =
                                  $event === true
                              "
                            />
                            <FieldLabel
                              for="page-setup-dialog-header-excludeHeaderHorizontalRuleEvenPage"
                            >
                              {{
                                $t(
                                  ($) =>
                                    $.dialog.pageSetup
                                      .excludeHorizontalRuleEvenPageDescription,
                                  { ns: 'dialog' },
                                )
                              }}
                            </FieldLabel>
                          </Field>
                        </template>
                      </template>
                    </FieldGroup>
                  </FieldSet>

                  <FieldSet>
                    <FieldLegend variant="label">
                      {{
                        $t(($) => $.dialog.pageSetup.footerHorizontalRule, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLegend>
                    <FieldGroup>
                      <Field orientation="horizontal">
                        <Checkbox
                          id="page-setup-dialog-footer-hr"
                          :model-value="form.showFooterHorizontalRule"
                          @update:model-value="
                            form.showFooterHorizontalRule = $event === true
                          "
                        />
                        <FieldContent>
                          <FieldLabel for="page-setup-dialog-footer-hr">
                            {{
                              $t(
                                ($) =>
                                  $.dialog.pageSetup
                                    .showFooterHorizontalRuleDescription,
                                {
                                  ns: 'dialog',
                                },
                              )
                            }}
                          </FieldLabel>
                        </FieldContent>
                      </Field>

                      <template v-if="form.showFooterHorizontalRule">
                        <FieldGroup class="grid gap-4 sm:grid-cols-3">
                          <Field orientation="horizontal">
                            <FieldLabel>
                              {{
                                $t(($) => $.dialog.pageSetup.color, {
                                  ns: 'dialog',
                                })
                              }}
                            </FieldLabel>
                            <ColorPicker
                              v-model="form.footerHorizontalRuleColor"
                            />
                          </Field>
                          <Field orientation="horizontal">
                            <FieldLabel>
                              {{
                                $t(($) => $.dialog.pageSetup.thickness, {
                                  ns: 'dialog',
                                })
                              }}
                            </FieldLabel>
                            <InputUnit
                              v-model="form.footerHorizontalRuleThickness"
                              unit="pt"
                              :min="0"
                              :max="100"
                              :step="0.5"
                              :format-options="fraction1FormatOptions"
                            />
                          </Field>
                          <Field orientation="horizontal">
                            <FieldLabel>
                              {{
                                $t(($) => $.dialog.pageSetup.marginTop, {
                                  ns: 'dialog',
                                })
                              }}
                            </FieldLabel>
                            <InputUnit
                              v-model="form.footerHorizontalRuleMarginTop"
                              unit="pt"
                              :min="0"
                              :max="1000"
                              :step="0.5"
                              :format-options="fraction1FormatOptions"
                            />
                          </Field>
                          <Field orientation="horizontal">
                            <FieldLabel>
                              {{
                                $t(($) => $.dialog.pageSetup.marginBottom, {
                                  ns: 'dialog',
                                })
                              }}
                            </FieldLabel>
                            <InputUnit
                              v-model="form.footerHorizontalRuleMarginBottom"
                              unit="pt"
                              :min="0"
                              :max="1000"
                              :step="0.5"
                              :format-options="fraction1FormatOptions"
                            />
                          </Field>
                        </FieldGroup>

                        <Field
                          v-if="form.headerDifferentFirstPage"
                          orientation="horizontal"
                        >
                          <Checkbox
                            id="page-setup-dialog-header-excludeFooterHorizontalRuleFirstPage"
                            :model-value="
                              form.excludeFooterHorizontalRuleFirstPage
                            "
                            @update:model-value="
                              form.excludeFooterHorizontalRuleFirstPage =
                                $event === true
                            "
                          />
                          <FieldLabel
                            for="page-setup-dialog-header-excludeFooterHorizontalRuleFirstPage"
                          >
                            {{
                              $t(
                                ($) =>
                                  $.dialog.pageSetup
                                    .excludeHorizontalRuleFirstPageDescription,
                                { ns: 'dialog' },
                              )
                            }}
                          </FieldLabel>
                        </Field>

                        <template v-if="form.headerDifferentOddEven">
                          <Field orientation="horizontal">
                            <Checkbox
                              id="page-setup-dialog-footer-excludeFooterHorizontalRuleOddPage"
                              :model-value="
                                form.excludeFooterHorizontalRuleOddPage
                              "
                              @update:model-value="
                                form.excludeFooterHorizontalRuleOddPage =
                                  $event === true
                              "
                            />
                            <FieldLabel
                              for="page-setup-dialog-footer-excludeFooterHorizontalRuleOddPage"
                            >
                              {{
                                $t(
                                  ($) =>
                                    $.dialog.pageSetup
                                      .excludeHorizontalRuleOddPageDescription,
                                  { ns: 'dialog' },
                                )
                              }}
                            </FieldLabel>
                          </Field>
                          <Field orientation="horizontal">
                            <Checkbox
                              id="page-setup-dialog-footer-excludeFooterHorizontalRuleEvenPage"
                              :model-value="
                                form.excludeFooterHorizontalRuleEvenPage
                              "
                              @update:model-value="
                                form.excludeFooterHorizontalRuleEvenPage =
                                  $event === true
                              "
                            />
                            <FieldLabel
                              for="page-setup-dialog-footer-excludeFooterHorizontalRuleEvenPage"
                            >
                              {{
                                $t(
                                  ($) =>
                                    $.dialog.pageSetup
                                      .excludeHorizontalRuleEvenPageDescription,
                                  { ns: 'dialog' },
                                )
                              }}
                            </FieldLabel>
                          </Field>
                        </template>
                      </template>
                    </FieldGroup>
                  </FieldSet>
                </template>

                <template v-else-if="section.value === 'miscellaneous'">
                  <Field
                    v-for="row in miscellaneousCheckboxRows"
                    :key="row.id"
                    orientation="horizontal"
                  >
                    <Checkbox
                      :id="row.id"
                      :model-value="form[row.modelKey]"
                      @update:model-value="
                        row.modelKey === 'melkiteRtl'
                          ? onMelkiteRtlChanged($event)
                          : setBoolean(row.modelKey, $event)
                      "
                    />
                    <FieldContent>
                      <FieldLabel :for="row.id">
                        {{ $t(row.labelSelector, { ns: 'dialog' }) }}
                      </FieldLabel>
                      <FieldDescription>
                        {{ $t(row.descriptionSelector, { ns: 'dialog' }) }}
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </template>

                <template v-else-if="section.value === 'dropCaps'">
                  <FieldSet>
                    <FieldLegend variant="label">
                      {{
                        $t(($) => $.dialog.pageSetup.defaultStyling, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLegend>
                    <FieldDescription>
                      {{
                        $t(($) => $.dialog.pageSetup.dropCapsDescription, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldDescription>
                    <FieldGroup class="gap-4">
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.color, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <ColorPicker v-model="form.dropCapDefaultColor" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.size, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputFontSize
                          v-model="form.dropCapDefaultFontSize"
                          :max="500"
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel for="page-setup-dialog-drop-cap-line-span">
                          {{
                            $t(($) => $.dialog.pageSetup.lineSpan, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputUnit
                          id="page-setup-dialog-drop-cap-line-span"
                          v-model="form.dropCapDefaultLineSpan"
                          unit="unitless"
                          :min="1"
                          :max="10"
                          :step="1"
                          :format-options="fraction0FormatOptions"
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel
                          for="page-setup-dialog-drop-cap-line-height"
                        >
                          {{
                            $t(($) => $.dialog.pageSetup.lineHeight, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputUnit
                          id="page-setup-dialog-drop-cap-line-height"
                          v-model="form.dropCapDefaultLineHeight"
                          unit="unitless"
                          :min="0"
                          :step="0.1"
                          :format-options="fraction2FormatOptions"
                          :nullable="true"
                          placeholder="normal"
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel for="page-setup-dialog-drop-cap-font">
                          {{
                            $t(($) => $.dialog.pageSetup.font, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <FontCombobox
                          id="page-setup-dialog-drop-cap-font"
                          :model-value="form.dropCapDefaultFontFamily"
                          :options="dropCapFontFamilies"
                          @update:model-value="
                            updateDefaultFontFamily(
                              'dropCapDefaultFontFamily',
                              'dropCapDefaultFontStyle',
                              $event,
                            )
                          "
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel for="page-setup-dialog-drop-cap-font-style">
                          {{
                            $t(($) => $.dialog.pageSetup.style, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <FontStyleSelect
                          id="page-setup-dialog-drop-cap-font-style"
                          v-model="form.dropCapDefaultFontStyle"
                          class="w-72 max-w-full"
                          :options="dropCapFontStyleOptions"
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.outline, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputStrokeWidth
                          v-model="form.dropCapDefaultStrokeWidth"
                        />
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </template>

                <template v-else-if="section.value === 'lyrics'">
                  <FieldSet>
                    <FieldLegend variant="label">
                      {{
                        $t(($) => $.dialog.pageSetup.defaultStyling, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLegend>
                    <FieldDescription>
                      {{
                        $t(($) => $.dialog.pageSetup.lyricsDescription, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldDescription>
                    <FieldGroup class="gap-4">
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.color, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <ColorPicker v-model="form.lyricsDefaultColor" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.size, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputFontSize v-model="form.lyricsDefaultFontSize" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel for="page-setup-dialog-lyrics-font">
                          {{
                            $t(($) => $.dialog.pageSetup.font, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <FontCombobox
                          id="page-setup-dialog-lyrics-font"
                          :model-value="form.lyricsDefaultFontFamily"
                          :options="lyricsFontFamilies"
                          @update:model-value="
                            updateDefaultFontFamily(
                              'lyricsDefaultFontFamily',
                              'lyricsDefaultFontStyle',
                              $event,
                            )
                          "
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel for="page-setup-dialog-lyrics-font-style">
                          {{
                            $t(($) => $.dialog.pageSetup.style, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <FontStyleSelect
                          id="page-setup-dialog-lyrics-font-style"
                          v-model="form.lyricsDefaultFontStyle"
                          class="w-72 max-w-full"
                          :options="lyricsFontStyleOptions"
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.outline, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputStrokeWidth
                          v-model="form.lyricsDefaultStrokeWidth"
                        />
                      </Field>
                    </FieldGroup>
                  </FieldSet>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel for="page-setup-dialog-lyrics-melisma-cutoff">
                        {{
                          $t(
                            ($) => $.dialog.pageSetup.lyricsMelismaCutoffWidth,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) =>
                              $.dialog.pageSetup
                                .lyricsMelismaCutoffWidthDescription,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <InputUnit
                      id="page-setup-dialog-lyrics-melisma-cutoff"
                      v-model="form.lyricsMelismaCutoffWidth"
                      unit="pt"
                      :min="0"
                      :step="1"
                      :format-options="fraction0FormatOptions"
                    />
                  </Field>

                  <Field orientation="horizontal">
                    <Checkbox
                      id="page-setup-dialog-ignore-punctuation-when-positioning-lyrics"
                      :model-value="form.ignorePunctuationWhenPositioningLyrics"
                      @update:model-value="
                        form.ignorePunctuationWhenPositioningLyrics =
                          $event === true
                      "
                    />
                    <FieldContent>
                      <FieldLabel
                        for="page-setup-dialog-ignore-punctuation-when-positioning-lyrics"
                      >
                        {{
                          $t(
                            ($) =>
                              $.dialog.pageSetup
                                .ignorePunctuationWhenPositioningLyrics,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) =>
                              $.dialog.pageSetup
                                .ignorePunctuationWhenPositioningLyricsDescription,
                            { ns: 'dialog' },
                          )
                        }}
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </template>

                <template v-else-if="section.value === 'textBoxes'">
                  <FieldSet>
                    <FieldLegend variant="label">
                      {{
                        $t(($) => $.dialog.pageSetup.defaultStyling, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLegend>
                    <FieldDescription>
                      {{
                        $t(($) => $.dialog.pageSetup.textBoxesDescription, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldDescription>
                    <FieldGroup class="gap-4">
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.color, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <ColorPicker v-model="form.textBoxDefaultColor" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.size, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputFontSize v-model="form.textBoxDefaultFontSize" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel
                          for="page-setup-dialog-text-box-line-height"
                        >
                          {{
                            $t(($) => $.dialog.pageSetup.lineHeight, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputUnit
                          id="page-setup-dialog-text-box-line-height"
                          v-model="form.textBoxDefaultLineHeight"
                          unit="unitless"
                          :min="0"
                          :step="0.1"
                          :format-options="fraction2FormatOptions"
                          :nullable="true"
                          placeholder="normal"
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel for="page-setup-dialog-text-box-font">
                          {{
                            $t(($) => $.dialog.pageSetup.font, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <FontCombobox
                          id="page-setup-dialog-text-box-font"
                          :model-value="form.textBoxDefaultFontFamily"
                          :options="textBoxFontFamilies"
                          @update:model-value="
                            updateDefaultFontFamily(
                              'textBoxDefaultFontFamily',
                              'textBoxDefaultFontStyle',
                              $event,
                            )
                          "
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel for="page-setup-dialog-text-box-font-style">
                          {{
                            $t(($) => $.dialog.pageSetup.style, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <FontStyleSelect
                          id="page-setup-dialog-text-box-font-style"
                          v-model="form.textBoxDefaultFontStyle"
                          class="w-72 max-w-full"
                          :options="textBoxFontStyleOptions"
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.outline, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputStrokeWidth
                          v-model="form.textBoxDefaultStrokeWidth"
                        />
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </template>

                <template v-else-if="section.value === 'modeKeys'">
                  <FieldSet>
                    <FieldLegend variant="label">
                      {{
                        $t(($) => $.dialog.pageSetup.defaultStyling, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLegend>
                    <FieldDescription>
                      {{
                        $t(($) => $.dialog.pageSetup.modeKeysDescription, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldDescription>
                    <FieldGroup class="gap-4">
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.color, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <ColorPicker v-model="form.modeKeyDefaultColor" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.size, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputFontSize v-model="form.modeKeyDefaultFontSize" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.outline, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputStrokeWidth
                          v-model="form.modeKeyDefaultStrokeWidth"
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel
                          for="page-setup-dialog-mode-key-height-adjust"
                        >
                          {{
                            $t(($) => $.dialog.pageSetup.heightAdjust, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputUnit
                          id="page-setup-dialog-mode-key-height-adjust"
                          v-model="form.modeKeyDefaultHeightAdjustment"
                          unit="pt"
                          :min="heightAdjustmentMin"
                          :max="heightAdjustmentMax"
                          :step="0.5"
                          :format-options="fraction2FormatOptions"
                        />
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </template>

                <template v-else-if="section.value === 'neumes'">
                  <FieldSet>
                    <FieldLegend variant="label">
                      {{
                        $t(($) => $.dialog.pageSetup.defaultStyling, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLegend>
                    <FieldDescription>
                      {{
                        $t(($) => $.dialog.pageSetup.neumesDescription, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldDescription>
                    <FieldGroup class="gap-4">
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.color, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <ColorPicker v-model="form.neumeDefaultColor" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.size, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputFontSize v-model="form.neumeDefaultFontSize" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel for="page-setup-dialog-neume-font">
                          {{
                            $t(($) => $.dialog.pageSetup.font, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <FontCombobox
                          id="page-setup-dialog-neume-font"
                          v-model="form.neumeDefaultFontFamily"
                          :options="neumeFontFamilies"
                          :disabled="form.melkiteRtl"
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.outline, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputStrokeWidth
                          v-model="form.neumeDefaultStrokeWidth"
                        />
                      </Field>
                    </FieldGroup>
                  </FieldSet>

                  <FieldSet>
                    <FieldLegend variant="label">
                      {{
                        $t(($) => $.dialog.pageSetup.alternateLineStyling, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldLegend>
                    <FieldDescription>
                      {{
                        $t(($) => $.dialog.pageSetup.alternateLineDescription, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldDescription>
                    <FieldGroup class="gap-4">
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.color, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <ColorPicker v-model="form.alternateLineDefaultColor" />
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel>
                          {{
                            $t(($) => $.dialog.pageSetup.size, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <InputFontSize
                          v-model="form.alternateLineDefaultFontSize"
                        />
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </template>

                <template v-else-if="section.value === 'neumeStyles'">
                  <FieldSet>
                    <FieldLegend variant="label">
                      {{ $t(section.labelSelector, { ns: 'dialog' }) }}
                    </FieldLegend>
                    <div
                      class="grid grid-cols-[1.5rem_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-1"
                    >
                      <div aria-hidden="true" />
                      <div class="h-6 text-xs font-medium text-foreground">
                        {{
                          $t(($) => $.dialog.pageSetup.type, {
                            ns: 'dialog',
                          })
                        }}
                      </div>
                      <div class="h-6 text-xs font-medium text-foreground">
                        {{
                          $t(($) => $.dialog.pageSetup.color, {
                            ns: 'dialog',
                          })
                        }}
                      </div>
                      <div class="h-6 text-xs font-medium text-foreground">
                        {{
                          $t(($) => $.dialog.pageSetup.outline, {
                            ns: 'dialog',
                          })
                        }}
                      </div>

                      <template v-for="row in neumeColorRows" :key="row.option">
                        <Checkbox
                          :id="getNeumeColorOptionId(row.option)"
                          :model-value="
                            selectedNeumeColorOptions.includes(row.option)
                          "
                          @update:model-value="
                            toggleNeumeColorOption(row.option, $event)
                          "
                        />
                        <FieldLabel
                          :for="getNeumeColorOptionId(row.option)"
                          class="min-w-0"
                        >
                          {{ $t(row.labelSelector, { ns: 'dialog' }) }}
                        </FieldLabel>
                        <ColorPicker v-model="form[row.colorKey]" />
                        <InputStrokeWidth v-model="form[row.strokeKey]" />
                      </template>
                    </div>
                  </FieldSet>

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel>
                        {{
                          $t(($) => $.dialog.pageSetup.neumeBulkColor, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) => $.dialog.pageSetup.neumeBulkColorDescription,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldDescription>
                    </FieldContent>
                    <div class="flex flex-wrap items-center gap-3">
                      <ColorPicker v-model="neumeBulkColor" />
                      <Button
                        type="button"
                        variant="outline"
                        @click="changeNeumeColorInBulk"
                      >
                        <PhPaintBucket />
                        {{
                          $t(($) => $.dialog.pageSetup.applyColor, {
                            ns: 'dialog',
                          })
                        }}
                      </Button>
                    </div>
                  </Field>
                </template>
              </FieldGroup>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </form>

      <div class="flex flex-col items-center border-y bg-white py-2 [--zoom:1]">
        <FieldTitle>
          {{ $t(($) => $.dialog.pageSetup.preview, { ns: 'dialog' }) }}
        </FieldTitle>
        <div class="flex justify-center">
          <div
            v-for="(element, index) in previewNeumes"
            :key="index"
            class="inline-flex"
            :style="getPreviewGapStyle(element, index)"
          >
            <template v-if="isSyllableElement(element.elementType)">
              <NeumeBoxSyllable
                class="syllable-box"
                :note="element as NoteElement"
                :page-setup="form"
              />
            </template>
            <template v-if="isMartyriaElement(element.elementType)">
              <NeumeBoxMartyria
                class="marytria-neume-box"
                :neume="element as MartyriaElement"
                :page-setup="form"
              />
            </template>
            <template v-if="isTempoElement(element.elementType)">
              <NeumeBoxTempo
                class="tempo-neume-box"
                :neume="element as TempoElement"
                :page-setup="form"
              />
            </template>
          </div>
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" type="button">
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
        <Button variant="outline" type="button" @click="saveAsDefault">
          <PhFloppyDisk />
          {{ $t(($) => $.dialog.common.setAsDefault, { ns: 'dialog' }) }}
        </Button>
        <Button variant="outline" type="button" @click="resetToSystemDefaults">
          <PhArrowCounterClockwise />
          {{ $t(($) => $.dialog.common.useSystemDefault, { ns: 'dialog' }) }}
        </Button>
        <Button type="submit" form="page-setup-form">
          <PhCheck />
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  PhArrowCounterClockwise,
  PhArrowsInLineHorizontal,
  PhArticleNyTimes,
  PhBookOpenText,
  PhCheck,
  PhFile,
  PhFloppyDisk,
  PhGearFine,
  PhMusicNotes,
  PhPaintBucket,
  PhPalette,
  PhPlaylist,
  PhSplitHorizontal,
  PhTextbox,
  PhTextT,
} from '@phosphor-icons/vue';
import type { SelectorParam } from 'i18next';
import type { Component, PropType } from 'vue';
import { computed, ref } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import { toDisplay } from '@/components/InputUnit.types';
import InputUnit from '@/components/InputUnit.vue';
import NeumeBoxMartyria from '@/components/NeumeBoxMartyria.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import NeumeBoxTempo from '@/components/NeumeBoxTempo.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { MartyriaElement, TempoElement } from '@/models/Element';
import { ElementType, NoteElement } from '@/models/Element';
import {
  Accidental,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  QuantitativeNeume,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import type { PageSize, PageSizeUnit } from '@/models/PageSetup';
import { PageSetup, pageSizes } from '@/models/PageSetup';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import { fontCatalog } from '@/services/FontCatalog';
import { fontService } from '@/services/FontService';
import { SaveService } from '@/services/SaveService';
import {
  getFontStyleOptions,
  remapFontStyleForFamily,
} from '@/utils/fontStyle';
import {
  fraction0FormatOptions,
  fraction1FormatOptions,
  fraction2FormatOptions,
  fraction3FormatOptions,
} from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';
import { withZoom } from '@/utils/withZoom';

type CheckboxValue = boolean | 'indeterminate';
type DialogSelector = SelectorParam<'dialog'>;
type BooleanPageSetupKey = {
  [K in keyof PageSetup]: PageSetup[K] extends boolean ? K : never;
}[keyof PageSetup];
type DefaultFontFamilyKey =
  | 'dropCapDefaultFontFamily'
  | 'lyricsDefaultFontFamily'
  | 'textBoxDefaultFontFamily';
type DefaultFontStyleKey =
  | 'dropCapDefaultFontStyle'
  | 'lyricsDefaultFontStyle'
  | 'textBoxDefaultFontStyle';
type NeumeColorKey =
  | 'accidentalDefaultColor'
  | 'breathDefaultColor'
  | 'crossDefaultColor'
  | 'fthoraDefaultColor'
  | 'gorgonDefaultColor'
  | 'heteronDefaultColor'
  | 'isonDefaultColor'
  | 'koronisDefaultColor'
  | 'martyriaDefaultColor'
  | 'measureBarDefaultColor'
  | 'measureNumberDefaultColor'
  | 'noteIndicatorDefaultColor'
  | 'tempoDefaultColor';
type NeumeStrokeKey =
  | 'accidentalDefaultStrokeWidth'
  | 'breathDefaultStrokeWidth'
  | 'crossDefaultStrokeWidth'
  | 'fthoraDefaultStrokeWidth'
  | 'gorgonDefaultStrokeWidth'
  | 'heteronDefaultStrokeWidth'
  | 'isonDefaultStrokeWidth'
  | 'koronisDefaultStrokeWidth'
  | 'martyriaDefaultStrokeWidth'
  | 'measureBarDefaultStrokeWidth'
  | 'measureNumberDefaultStrokeWidth'
  | 'noteIndicatorDefaultStrokeWidth'
  | 'tempoDefaultStrokeWidth';

enum NeumeColorOptions {
  Accidentals = 'Accidentals',
  Breath = 'Breath',
  Cross = 'Cross',
  Fthoras = 'Fthoras',
  Gorgons = 'Gorgons',
  Heterons = 'Heterons',
  Ison = 'Ison',
  Koronis = 'Koronis',
  Martyria = 'Martyria',
  MeasureBars = 'MeasureBars',
  MeasureNumbers = 'MeasureNumbers',
  NoteIndicators = 'NoteIndicators',
  Tempos = 'Tempos',
}

const previewNoteConfigs = [
  {
    quantitativeNeume: QuantitativeNeume.Ison,
    gorgonNeume: GorgonNeume.Gorgon_Bottom,
    ison: Ison.Ga,
  },
  {
    quantitativeNeume: QuantitativeNeume.Ison,
    timeNeume: TimeNeume.Dipli,
    measureBarLeft: MeasureBar.MeasureBarRight,
    measureBarRight: MeasureBar.MeasureBarRight,
    measureNumber: MeasureNumber.Three,
  },
  {
    quantitativeNeume: QuantitativeNeume.Oligon,
    vocalExpressionNeume: VocalExpressionNeume.Antikenoma,
    ison: Ison.Ni,
  },
  {
    quantitativeNeume: QuantitativeNeume.Apostrophos,
  },
  {
    quantitativeNeume: QuantitativeNeume.Oligon,
    timeNeume: TimeNeume.Klasma_Top,
  },
  {
    quantitativeNeume: QuantitativeNeume.Oligon,
    gorgonNeume: GorgonNeume.Gorgon_Top,
    vocalExpressionNeume: VocalExpressionNeume.Psifiston,
    accidental: Accidental.Flat_2_Right,
  },
  {
    quantitativeNeume: QuantitativeNeume.Apostrophos,
  },
];

function createPreviewNote(
  args: Partial<NoteElement>,
  measureBarSpacing: number,
): NoteElement {
  const note = new NoteElement();
  Object.assign(note, args);
  note.computedMeasureBarLeftLeadingSpacing =
    note.measureBarLeft != null ? measureBarSpacing : 0;
  note.computedMeasureBarRightTrailingSpacing =
    note.measureBarRight != null ? measureBarSpacing : 0;
  return note;
}

function getPreviewGapStyle(
  element: { elementType: ElementType } & Partial<NoteElement>,
  index: number | string,
) {
  const numericIndex = Number(index);
  const glue =
    element.elementType === ElementType.Martyria
      ? fontService.getMartyriaGlue(form.value.neumeDefaultFontFamily)
      : fontService.getStandardGlue(form.value.neumeDefaultFontFamily);

  const gapWidth =
    form.value.neumeDefaultFontSize * glue.width +
    form.value.neumeDefaultSpacing;

  return {
    marginInlineStart: numericIndex > 0 ? withZoom(gapWidth) : undefined,
  };
}

const emit = defineEmits<{
  update: [pageSetup: PageSetup];
}>();

const props = defineProps({
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const open = defineModel<boolean>('open', { required: true });

const sections = [
  {
    value: 'pageSize',
    labelSelector: ($) => $.dialog.pageSetup.pageSize,
    icon: PhFile,
  },
  {
    value: 'margins',
    labelSelector: ($) => $.dialog.pageSetup.margins,
    icon: PhArrowsInLineHorizontal,
  },
  {
    value: 'spacing',
    labelSelector: ($) => $.dialog.pageSetup.spacing,
    icon: PhSplitHorizontal,
  },
  {
    value: 'headersAndFooters',
    labelSelector: ($) => $.dialog.pageSetup.headersAndFooters,
    icon: PhBookOpenText,
  },
  {
    value: 'miscellaneous',
    labelSelector: ($) => $.dialog.pageSetup.miscellaneous,
    icon: PhGearFine,
  },
  {
    value: 'dropCaps',
    labelSelector: ($) => $.dialog.pageSetup.dropCaps,
    icon: PhArticleNyTimes,
  },
  {
    value: 'lyrics',
    labelSelector: ($) => $.dialog.pageSetup.lyrics,
    icon: PhTextT,
  },
  {
    value: 'textBoxes',
    labelSelector: ($) => $.dialog.pageSetup.textBoxes,
    icon: PhTextbox,
  },
  {
    value: 'modeKeys',
    labelSelector: ($) => $.dialog.pageSetup.modeKeys,
    icon: PhPlaylist,
  },
  {
    value: 'neumes',
    labelSelector: ($) => $.dialog.pageSetup.neumes,
    icon: PhMusicNotes,
  },
  {
    value: 'neumeStyles',
    labelSelector: ($) => $.dialog.pageSetup.neumeStyles,
    icon: PhPalette,
  },
] as const satisfies ReadonlyArray<{
  value: string;
  labelSelector: DialogSelector;
  icon: Component;
}>;

const pageSizeUnitOptions = [
  { value: 'in', labelSelector: ($) => $.dialog.pageSetup.in },
  { value: 'cm', labelSelector: ($) => $.dialog.pageSetup.cm },
  { value: 'mm', labelSelector: ($) => $.dialog.pageSetup.mm },
  { value: 'pt', labelSelector: ($) => $.dialog.pageSetup.pt },
  { value: 'pc', labelSelector: ($) => $.dialog.pageSetup.pc },
] as const satisfies ReadonlyArray<{
  value: PageSizeUnit;
  labelSelector: DialogSelector;
}>;

const form = ref(new PageSetup());
const neumeBulkColor = ref('#000000');

const previewNeumes = computed(() => {
  const measureBarSpacing =
    form.value.neumeDefaultFontSize *
      fontService.getStandardGlue(form.value.neumeDefaultFontFamily).width +
    form.value.neumeDefaultSpacing;

  return [
    {
      elementType: ElementType.Tempo,
      neume: 'Moderate',
    },
    ...previewNoteConfigs.map((config) =>
      createPreviewNote(config, measureBarSpacing),
    ),
    {
      elementType: ElementType.Martyria,
      auto: true,
      note: 'Thi',
      rootSign: 'DeltaDotted',
      scale: 'Diatonic',
      fthora: 'HardChromaticPa_Top',
      verticalOffset: form.value.martyriaVerticalOffset,
    },
  ] as any;
});
const selectedNeumeColorOptions = ref<NeumeColorOptions[]>([]);

const dropCapFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);
const lyricsFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);
const textBoxFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);
const dropCapFontStyleOptions = computed(() =>
  getFontStyleOptions(form.value.dropCapDefaultFontFamily),
);
const lyricsFontStyleOptions = computed(() =>
  getFontStyleOptions(form.value.lyricsDefaultFontFamily),
);
const textBoxFontStyleOptions = computed(() =>
  getFontStyleOptions(form.value.textBoxDefaultFontFamily),
);
const neumeFontFamilies = computed(() => {
  if (form.value.melkiteRtl) {
    return [{ label: 'EZ Psaltica RTL', value: 'NeanesRTL' }];
  } else {
    return [
      { label: 'EZ Psaltica', value: 'Neanes' },
      { label: 'Stathis Series', value: 'NeanesStathisSeries' },
      { label: 'Almouzios', value: 'Almouzios' },
    ];
  }
});
const neumeSpacingMax = computed(() =>
  Math.round(toDisplay(form.value.pageWidth, form.value.pageSizeUnit) ?? 0),
);
const heightAdjustmentMin = computed(
  () => -Math.round(Unit.fromPt(props.pageSetup.pageHeight)),
);
const heightAdjustmentMax = computed(() =>
  Unit.toPt(props.pageSetup.pageHeight),
);
const pageSize = computed({
  get: () => form.value.pageSize,
  set: (value: PageSize) => {
    form.value.pageSize = value;
    updatePageSize();
  },
});
const landscape = computed({
  get: () => form.value.landscape,
  set: (value: boolean) => {
    form.value.landscape = value;
    updatePageSize();
  },
});
const orientation = computed({
  get: () => (landscape.value ? 'landscape' : 'portrait'),
  set: (value: 'portrait' | 'landscape' | undefined) => {
    if (value == null) {
      return;
    }

    landscape.value = value === 'landscape';
  },
});
const marginUnitLabel = computed<SelectorParam<'dialog'> | undefined>(() => {
  switch (form.value.pageSizeUnit) {
    case 'pc':
      return ($) => $.dialog.pageSetup.pc;
    case 'pt':
      return ($) => $.dialog.pageSetup.pt;
    case 'cm':
      return ($) => $.dialog.pageSetup.cm;
    case 'mm':
      return ($) => $.dialog.pageSetup.mm;
    case 'in':
      return ($) => $.dialog.pageSetup.in;
    default:
      console.warn(`Unknown page size unit: ${form.value.pageSizeUnit}`);
      return undefined;
  }
});
const marginStep = computed(() => {
  switch (form.value.pageSizeUnit) {
    case 'pc':
      return 1;
    case 'pt':
      return 1;
    case 'cm':
      return 0.1;
    case 'mm':
      return 1;
    case 'in':
      return 0.1;
    default:
      console.warn(`Unknown page size unit: ${form.value.pageSizeUnit}`);
      return 1;
  }
});
const spacingStep = computed(() => {
  switch (form.value.pageSizeUnit) {
    case 'pc':
      return 0.05;
    case 'pt':
      return 0.5;
    case 'cm':
      return 0.01;
    case 'mm':
      return 0.1;
    case 'in':
      return 0.005;
    default:
      console.warn(`Unknown page size unit: ${form.value.pageSizeUnit}`);
      return 1;
  }
});

const topMarginMax = computed(() =>
  toPositiveDisplay(
    form.value.pageHeight - form.value.bottomMargin - Unit.fromInch(0.5),
  ),
);
const bottomMarginMax = computed(() =>
  toPositiveDisplay(
    form.value.pageHeight - form.value.topMargin - Unit.fromInch(0.5),
  ),
);
const leftMarginMax = computed(() =>
  toPositiveDisplay(
    form.value.pageWidth - form.value.rightMargin - Unit.fromInch(0.5),
  ),
);
const rightMarginMax = computed(() =>
  toPositiveDisplay(
    form.value.pageWidth - form.value.leftMargin - Unit.fromInch(0.5),
  ),
);
const headerMarginMax = computed(() =>
  toPositiveDisplay(form.value.innerPageHeight),
);
const footerMarginMax = computed(() =>
  toPositiveDisplay(form.value.innerPageHeight),
);
const lyricsVerticalOffsetMax = computed(
  () =>
    toDisplay(
      form.value.innerPageHeight -
        form.value.lyricsDefaultFontSize -
        form.value.neumeDefaultFontSize,
      form.value.pageSizeUnit,
    ) ?? 0,
);
const lyricsMinimumSpacingMax = computed(() =>
  toPositiveDisplay(form.value.innerPageWidth),
);
const lineHeightMax = computed(() =>
  toPositiveDisplay(form.value.innerPageHeight),
);
const hyphenSpacingMax = computed(() =>
  toPositiveDisplay(form.value.innerPageWidth),
);

const minimumSyllableToHyphenClearanceMax = computed(() =>
  toPositiveDisplay(form.value.innerPageWidth),
);

const marginRows = [
  {
    id: 'page-setup-dialog-top-margin',
    labelSelector: ($) => $.dialog.common.top,
    modelKey: 'topMargin',
    max: topMarginMax,
    update: updateTopMargin,
  },
  {
    id: 'page-setup-dialog-bottom-margin',
    labelSelector: ($) => $.dialog.common.bottom,
    modelKey: 'bottomMargin',
    max: bottomMarginMax,
    update: updateBottomMargin,
  },
  {
    id: 'page-setup-dialog-left-margin',
    labelSelector: ($) => $.dialog.common.left,
    modelKey: 'leftMargin',
    max: leftMarginMax,
    update: updateLeftMargin,
  },
  {
    id: 'page-setup-dialog-right-margin',
    labelSelector: ($) => $.dialog.common.right,
    modelKey: 'rightMargin',
    max: rightMarginMax,
    update: updateRightMargin,
  },
  {
    id: 'page-setup-dialog-header-margin',
    labelSelector: ($) => $.dialog.pageSetup.header,
    modelKey: 'headerMargin',
    max: headerMarginMax,
    update: updateHeaderMargin,
  },
  {
    id: 'page-setup-dialog-footer-margin',
    labelSelector: ($) => $.dialog.pageSetup.footer,
    modelKey: 'footerMargin',
    max: footerMarginMax,
    update: updateFooterMargin,
  },
] as const satisfies ReadonlyArray<{
  id: string;
  labelSelector: DialogSelector;
  modelKey:
    | 'topMargin'
    | 'bottomMargin'
    | 'leftMargin'
    | 'rightMargin'
    | 'headerMargin'
    | 'footerMargin';
  max: typeof topMarginMax;
  update: (value: number | null) => void;
}>;

const headerFooterCheckboxRows = [
  {
    id: 'page-setup-dialog-show-header',
    labelSelector: ($) => $.dialog.pageSetup.includeHeader,
    modelKey: 'showHeader',
  },
  {
    id: 'page-setup-dialog-show-footer',
    labelSelector: ($) => $.dialog.pageSetup.includeFooter,
    modelKey: 'showFooter',
  },
  {
    id: 'page-setup-dialog-different-first-page',
    labelSelector: ($) => $.dialog.pageSetup.differentFirstPage,
    modelKey: 'headerDifferentFirstPage',
  },
  {
    id: 'page-setup-dialog-different-odd-even',
    labelSelector: ($) => $.dialog.pageSetup.differentOddAndEven,
    modelKey: 'headerDifferentOddEven',
  },
  {
    id: 'page-setup-dialog-rich-header-footer',
    labelSelector: ($) => $.dialog.pageSetup.richHeaderFooter,
    modelKey: 'richHeaderFooter',
  },
] as const satisfies ReadonlyArray<{
  id: string;
  labelSelector: DialogSelector;
  modelKey: BooleanPageSetupKey;
}>;

const miscellaneousCheckboxRows = [
  {
    id: 'page-setup-dialog-chrysanthine-accidentals',
    labelSelector: ($) => $.dialog.pageSetup.useChrysanthineAccidentals,
    descriptionSelector: ($) =>
      $.dialog.pageSetup.useChrysanthineAccidentalsDescription,
    modelKey: 'chrysanthineAccidentals',
  },
  {
    id: 'page-setup-dialog-no-fthora-restrictions',
    labelSelector: ($) => $.dialog.pageSetup.disableFthoraRestrictions,
    descriptionSelector: ($) =>
      $.dialog.pageSetup.disableFthoraRestrictionsDescription,
    modelKey: 'noFthoraRestrictions',
  },
  {
    id: 'page-setup-dialog-align-ison-indicators',
    labelSelector: ($) => $.dialog.pageSetup.alignIsonIndicators,
    descriptionSelector: ($) =>
      $.dialog.pageSetup.alignIsonIndicatorsDescription,
    modelKey: 'alignIsonIndicators',
  },
  {
    id: 'page-setup-dialog-melkite-rtl',
    labelSelector: ($) => $.dialog.pageSetup.melkiteRtl,
    descriptionSelector: ($) => $.dialog.pageSetup.melkiteRtlDescription,
    modelKey: 'melkiteRtl',
  },
  {
    id: 'page-setup-dialog-disable-melismata',
    labelSelector: ($) => $.dialog.pageSetup.disableGreekMelismata,
    descriptionSelector: ($) =>
      $.dialog.pageSetup.disableGreekMelismataDescription,
    modelKey: 'disableGreekMelismata',
  },
] as const satisfies ReadonlyArray<{
  id: string;
  labelSelector: DialogSelector;
  descriptionSelector: DialogSelector;
  modelKey: BooleanPageSetupKey;
}>;

const neumeColorRows = [
  {
    option: NeumeColorOptions.Accidentals,
    labelSelector: ($) => $.dialog.pageSetup.accidentals,
    colorKey: 'accidentalDefaultColor',
    strokeKey: 'accidentalDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.Breath,
    labelSelector: ($) => $.dialog.pageSetup.breath,
    colorKey: 'breathDefaultColor',
    strokeKey: 'breathDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.Cross,
    labelSelector: ($) => $.dialog.pageSetup.cross,
    colorKey: 'crossDefaultColor',
    strokeKey: 'crossDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.Fthoras,
    labelSelector: ($) => $.dialog.pageSetup.fthoras,
    colorKey: 'fthoraDefaultColor',
    strokeKey: 'fthoraDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.Gorgons,
    labelSelector: ($) => $.dialog.pageSetup.gorgons,
    colorKey: 'gorgonDefaultColor',
    strokeKey: 'gorgonDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.Heterons,
    labelSelector: ($) => $.dialog.pageSetup.heterons,
    colorKey: 'heteronDefaultColor',
    strokeKey: 'heteronDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.Ison,
    labelSelector: ($) => $.dialog.pageSetup.ison,
    colorKey: 'isonDefaultColor',
    strokeKey: 'isonDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.Koronis,
    labelSelector: ($) => $.dialog.pageSetup.koronis,
    colorKey: 'koronisDefaultColor',
    strokeKey: 'koronisDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.Martyria,
    labelSelector: ($) => $.dialog.pageSetup.martyriae,
    colorKey: 'martyriaDefaultColor',
    strokeKey: 'martyriaDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.MeasureBars,
    labelSelector: ($) => $.dialog.pageSetup.measureBars,
    colorKey: 'measureBarDefaultColor',
    strokeKey: 'measureBarDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.MeasureNumbers,
    labelSelector: ($) => $.dialog.pageSetup.measureNo,
    colorKey: 'measureNumberDefaultColor',
    strokeKey: 'measureNumberDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.NoteIndicators,
    labelSelector: ($) => $.dialog.pageSetup.noteIndicators,
    colorKey: 'noteIndicatorDefaultColor',
    strokeKey: 'noteIndicatorDefaultStrokeWidth',
  },
  {
    option: NeumeColorOptions.Tempos,
    labelSelector: ($) => $.dialog.pageSetup.tempos,
    colorKey: 'tempoDefaultColor',
    strokeKey: 'tempoDefaultStrokeWidth',
  },
] as const satisfies ReadonlyArray<{
  option: NeumeColorOptions;
  labelSelector: DialogSelector;
  colorKey: NeumeColorKey;
  strokeKey: NeumeStrokeKey;
}>;

Object.assign(form.value, props.pageSetup);

function toPositiveDisplay(value: number) {
  return Math.max(0, toDisplay(value, form.value.pageSizeUnit) ?? 0);
}

function storageValue(value: number | null) {
  return value ?? 0;
}

function setBoolean(key: BooleanPageSetupKey, value: CheckboxValue) {
  form.value[key] = value === true;
}

function updateDefaultFontFamily(
  familyKey: DefaultFontFamilyKey,
  fontStyleKey: DefaultFontStyleKey,
  family: string,
) {
  form.value[familyKey] = family;
  form.value[fontStyleKey] = remapFontStyleForFamily(
    form.value[fontStyleKey],
    family,
  );
}

function toggleNeumeColorOption(
  option: NeumeColorOptions,
  value: CheckboxValue,
) {
  const checked = value === true;
  const index = selectedNeumeColorOptions.value.indexOf(option);

  if (checked && index < 0) {
    selectedNeumeColorOptions.value.push(option);
  } else if (!checked && index >= 0) {
    selectedNeumeColorOptions.value.splice(index, 1);
  }
}

function getNeumeColorOptionId(option: NeumeColorOptions) {
  return `page-setup-dialog-neume-color-${option}`;
}

function changeNeumeColorInBulk() {
  const selectedOptions = new Set(selectedNeumeColorOptions.value);

  for (const row of neumeColorRows) {
    if (selectedOptions.has(row.option)) {
      form.value[row.colorKey] = neumeBulkColor.value;
    }
  }
}

function updateTopMargin(value: number | null) {
  form.value.topMargin = Math.min(
    Math.max(storageValue(value), 0),
    form.value.pageHeight - form.value.bottomMargin - Unit.fromInch(0.5),
  );
}

function updateBottomMargin(value: number | null) {
  form.value.bottomMargin = Math.min(
    Math.max(storageValue(value), 0),
    form.value.pageHeight - form.value.topMargin - Unit.fromInch(0.5),
  );
}

function updateLeftMargin(value: number | null) {
  form.value.leftMargin = Math.min(
    Math.max(storageValue(value), 0),
    form.value.pageWidth - form.value.rightMargin - Unit.fromInch(0.5),
  );
}

function updateRightMargin(value: number | null) {
  form.value.rightMargin = Math.min(
    Math.max(storageValue(value), 0),
    form.value.pageWidth - form.value.leftMargin - Unit.fromInch(0.5),
  );
}

function updateHeaderMargin(value: number | null) {
  form.value.headerMargin = Math.min(
    Math.max(storageValue(value), 0),
    form.value.innerPageHeight,
  );
}

function updateFooterMargin(value: number | null) {
  form.value.footerMargin = Math.min(
    Math.max(storageValue(value), 0),
    form.value.innerPageHeight,
  );
}

function updateLyricsVerticalOffset(value: number | null) {
  form.value.lyricsVerticalOffset = Math.min(
    storageValue(value),
    form.value.innerPageHeight -
      form.value.lyricsDefaultFontSize -
      form.value.neumeDefaultFontSize,
  );
}

function updateLyricsMinimumSpacing(value: number | null) {
  form.value.lyricsMinimumSpacing = Math.min(
    storageValue(value),
    form.value.innerPageWidth,
  );
}

function updateLineHeight(value: number | null) {
  form.value.lineHeight = Math.min(
    Math.max(storageValue(value), 0),
    form.value.innerPageHeight,
  );
}

function updateHyphenSpacing(value: number | null) {
  form.value.hyphenSpacing = Math.min(
    Math.max(storageValue(value), 0),
    form.value.innerPageWidth,
  );
}

function updateMinimumSyllableToHyphenClearance(value: number | null) {
  form.value.minimumSyllableToHyphenClearance = Math.min(
    Math.max(storageValue(value), 0),
    form.value.innerPageWidth,
  );
}

function onMelkiteRtlChanged(value: CheckboxValue) {
  form.value.melkiteRtl = value === true;
  onChangeMelkiteRtl();
}

function onChangeMelkiteRtl() {
  form.value.neumeDefaultFontFamily = form.value.melkiteRtl
    ? 'NeanesRTL'
    : 'Neanes';
}

function isSyllableElement(elementType: ElementType) {
  return elementType == ElementType.Note;
}

function isMartyriaElement(elementType: ElementType) {
  return elementType == ElementType.Martyria;
}

function isTempoElement(elementType: ElementType) {
  return elementType == ElementType.Tempo;
}

function updatePageSize() {
  if (form.value.pageSize === 'Custom') {
    if (form.value.landscape) {
      form.value.pageWidth = form.value.pageHeightCustom;
      form.value.pageHeight = form.value.pageWidthCustom;
    } else {
      form.value.pageWidth = form.value.pageWidthCustom;
      form.value.pageHeight = form.value.pageHeightCustom;
    }
    return;
  }

  const pageSize = pageSizes.find((x) => x.name === form.value.pageSize);
  if (pageSize) {
    if (form.value.landscape) {
      form.value.pageWidth = pageSize.height;
      form.value.pageHeight = pageSize.width;
    } else {
      form.value.pageWidth = pageSize.width;
      form.value.pageHeight = pageSize.height;
    }
  }
}

function updatePageSetup() {
  emit('update', form.value);
  open.value = false;
}

function saveAsDefault() {
  const defaults = new PageSetup_v1();
  SaveService.SavePageSetup(defaults, form.value);

  localStorage.setItem('pageSetupDefault', JSON.stringify(defaults));
}

function resetToSystemDefaults() {
  form.value = new PageSetup();
}
</script>
