import { Node, mergeAttributes } from '@tiptap/core'

export interface AudioOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    audio: {
      setAudio: (options: { src: string }) => ReturnType
    }
  }
}

export const Audio = Node.create<AudioOptions>({
  name: 'audio',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'w-full rounded-lg border', // Added class for basic styling
      },
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: { // Ensure controls are always true by default
        default: true,
        HTMLAttributes: {
          controls: true,
        }
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'audio',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // Ensure 'controls' is part of the merged attributes
    const finalAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { controls: true });
    return ['audio', finalAttributes]
  },

  addCommands() {
    return {
      setAudio: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
