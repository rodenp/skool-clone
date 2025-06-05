import { Node, mergeAttributes } from '@tiptap/core'

export interface VideoOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType
    }
  }
}

export const Video = Node.create<VideoOptions>({
  name: 'video',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg border', // Added class for responsiveness and basic styling
      },
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        HTMLAttributes: {
          controls: true, // Ensure controls are always there by default through HTML attribute
        }
      },
      // Consider removing width and height attributes if fully relying on CSS for sizing
      // width: {
      //   default: '100%',
      // },
      // height: {
      //   default: 'auto',
      // },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // Ensure 'controls' is part of the merged attributes
    const finalAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { controls: true });
    return ['video', finalAttributes]
  },

  addCommands() {
    return {
      setVideo: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
