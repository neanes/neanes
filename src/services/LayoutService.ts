import { DropCapElement, ElementType, MartyriaElement, NoteElement, ScoreElement, TextBoxElement } from "@/models/Element";
import { neumeMap } from "@/models/NeumeMappings";
import { VocalExpressionNeume } from "@/models/Neumes";
import { Line, Page } from "@/models/Page";
import { PageSetup } from "@/models/PageSetup";
import { TextMeasurementService } from "./TextMeasurementService";

export class LayoutService {
    public static processPages(elements: ScoreElement[], pageSetup: PageSetup) {
        const defaultNeumeElementWidthPx = 39;
        const defaultNeumeSpacingPx = 3;

        const pages: Page[] = [];

        let page: Page = {
            lines: [],
        };

        let line: Line = {
            elements: []
        };

        page.lines.push(line);
        pages.push(page);

        let currentPageHeightPx = 0;
        let currentLineWidthPx = 0;

        let lastLineHeightPx = 0;

        let lastElementWasLineBreak = false;
        let lastElementWasPageBreak = false;

        for (let element of elements) {
            let elementWidthPx = defaultNeumeElementWidthPx;

            if (element.elementType === ElementType.TextBox) {
                let textBoxElement = element as TextBoxElement;

                elementWidthPx = pageSetup.innerPageWidth;
                textBoxElement.height = Math.ceil(TextMeasurementService.getTextHeight(textBoxElement.content, `${textBoxElement.fontSize}px ${textBoxElement.fontFamily}`));
            }

            if (element.elementType === ElementType.StaffText) {
                line.elements.push(element);
                continue;
            }

            if (element.elementType === ElementType.Note) {
                const noteElement = element as NoteElement;
                const mapping = neumeMap.get(noteElement.quantitativeNeume.neume)!;

                let text = mapping.text;

                if (noteElement.vocalExpressionNeume != null && noteElement.vocalExpressionNeume.neume === VocalExpressionNeume.Vareia) {
                    const vareiaMapping = neumeMap.get(VocalExpressionNeume.Vareia)!;
                    text = vareiaMapping.text + text;
                }

                elementWidthPx = Math.max(
                    Math.floor(TextMeasurementService.getTextWidth(text, `${pageSetup.neumeDefaultFontSize}px ${mapping.fontFamily}`)),
                    Math.floor(TextMeasurementService.getTextWidth(noteElement.lyrics, `${pageSetup.lyricsDefaultFontSize}px ${pageSetup.lyricsDefaultFontFamily}`))
                );
            }
            else if (element.elementType === ElementType.Martyria) {
                const martyriaElement = element as MartyriaElement;
                const mapping = neumeMap.get(martyriaElement.note)!;
                elementWidthPx = Math.floor(TextMeasurementService.getTextWidth(mapping.text, `${pageSetup.neumeDefaultFontSize}px ${mapping.fontFamily}`));
            }
            else if (element.elementType === ElementType.DropCap) {
                const dropCapElement = element as DropCapElement;
                const dropCapFontFamily = dropCapElement.fontFamily || pageSetup.dropCapDefaultFontFamily;
                const dropCapFontSize = dropCapElement.fontSize || pageSetup.dropCapDefaultFontSize;
                elementWidthPx = Math.floor(TextMeasurementService.getTextWidth(dropCapElement.content, `${dropCapFontSize}px ${dropCapFontFamily}`));
            }

            if (currentLineWidthPx + elementWidthPx > pageSetup.innerPageWidth || lastElementWasLineBreak) {
                line = {
                    elements: [],
                };

                page.lines.push(line);

                // Calculate the current page height
                currentPageHeightPx = 0;

                for (let line of page.lines) {
                    let height = 0;

                    if (line.elements.some(x => x.elementType === ElementType.TextBox)) {
                        const textbox = line.elements.find(x => x.elementType === ElementType.TextBox) as TextBoxElement;
                        height = Math.max(10, textbox.height * 2);
                    }
                    else {
                        height = pageSetup.lineHeight;
                    }

                    currentPageHeightPx += height;

                    if (page.lines.indexOf(line) === page.lines.length - 1) {
                        lastLineHeightPx = height;
                    }
                }

                currentLineWidthPx = 0;
            }

            if (currentPageHeightPx > pageSetup.innerPageHeight || lastElementWasPageBreak) {
                page = {
                    lines: [],
                };

                line = {
                    elements: [],
                };

                page.lines.push(line);
                pages.push(page);

                currentPageHeightPx = 0;
                currentLineWidthPx = 0;
                lastLineHeightPx = 0;
            }

            element.x = pageSetup.leftMargin + currentLineWidthPx;
            element.y = pageSetup.topMargin + currentPageHeightPx - lastLineHeightPx;
            element.width = elementWidthPx + defaultNeumeSpacingPx;

            // Special logic to adjust drop caps
            if (element.elementType === ElementType.DropCap) {
                const distanceFromTopToBottomOfLyrics = pageSetup.lyricsVerticalOffset + pageSetup.lyricsDefaultFontSize;
                const dropCapElement = element as DropCapElement;
                const dropCapFontFamily = dropCapElement.fontFamily || pageSetup.dropCapDefaultFontFamily;
                const dropCapFontSize = dropCapElement.fontSize || pageSetup.dropCapDefaultFontSize;
                const dropCapFont = `${dropCapFontSize}px ${dropCapFontFamily}`;
                const fontHeight = TextMeasurementService.getFontHeight(dropCapFont);
                const fountBoundingBoxDescent = TextMeasurementService.getFontBoundingBoxDescent(dropCapElement.content, dropCapFont);
                const adjustment = Math.floor(fontHeight - distanceFromTopToBottomOfLyrics - fountBoundingBoxDescent);

                element.y -= adjustment;
            }

            currentLineWidthPx += elementWidthPx + defaultNeumeSpacingPx;
            line.elements.push(element);

            lastElementWasLineBreak = element.lineBreak;
            lastElementWasPageBreak = element.pageBreak;
        }

        this.justifyLines(pages, pageSetup);

        return pages;
    }

    public static justifyLines(pages: Page[], pageSetup: PageSetup) {
        for (let page of pages) {
            for (let line of page.lines) {
                if (pages.indexOf(page) === pages.length - 1 && page.lines.indexOf(line) === page.lines.length - 1) {
                    continue;
                }

                if (line.elements.some(x => x.lineBreak == true)) {
                    continue;
                }

                if (line.elements.some(x => x.pageBreak == true)) {
                    continue;
                }

                let currentWidthPx = line.elements.map(x => x.width).reduce((sum, x) => sum + x, 0);

                let extraSpace = pageSetup.innerPageWidth - currentWidthPx;

                let spaceToAdd = extraSpace / line.elements.length;

                for (let [elementIndex, element] of line.elements.entries()) {
                    element.x += spaceToAdd * (elementIndex + 1);
                }
            }
        }
    }
}