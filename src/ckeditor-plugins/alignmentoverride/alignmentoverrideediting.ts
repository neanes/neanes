import { Plugin } from 'ckeditor5';

import { ALIGNMENT_VALUES } from '@/utils/alignmentOverride';

import {
  ALIGNMENT_OVERRIDE,
  AlignmentOverrideCommand,
} from './alignmentoverridecommand';

export default class AlignmentOverrideEditing extends Plugin {
  static get pluginName() {
    return 'AlignmentOverrideEditing';
  }

  init() {
    const editor = this.editor;
    const schema = editor.model.schema;

    schema.extend('$block', {
      allowAttributes: [ALIGNMENT_OVERRIDE],
    });
    schema.setAttributeProperties(ALIGNMENT_OVERRIDE, {
      isFormatting: true,
      blockAlignment: {
        left: {
          value: 'left',
        },
        center: {
          value: 'center',
        },
        right: {
          value: 'right',
        },
        justify: {
          value: 'justify',
        },
      },
    });

    editor.commands.add(
      'alignment',
      new AlignmentOverrideCommand(editor) as never,
    );

    editor.conversion.for('downcast').attributeToAttribute({
      model: {
        key: ALIGNMENT_OVERRIDE,
        values: [...ALIGNMENT_VALUES],
      },
      view: {
        left: {
          key: 'style',
          value: {
            'text-align': 'left',
          },
        },
        center: {
          key: 'style',
          value: {
            'text-align': 'center',
          },
        },
        right: {
          key: 'style',
          value: {
            'text-align': 'right',
          },
        },
        justify: {
          key: 'style',
          value: {
            'text-align': 'justify',
          },
        },
      },
    });

    for (const value of ALIGNMENT_VALUES) {
      editor.conversion.for('upcast').attributeToAttribute({
        view: {
          styles: {
            'text-align': value,
          },
        },
        model: {
          key: ALIGNMENT_OVERRIDE,
          value,
        },
      });
    }

    for (const value of ALIGNMENT_VALUES) {
      editor.conversion.for('upcast').attributeToAttribute({
        view: {
          key: 'align',
          value,
        },
        model: {
          key: ALIGNMENT_OVERRIDE,
          value,
        },
      });
    }
  }
}
