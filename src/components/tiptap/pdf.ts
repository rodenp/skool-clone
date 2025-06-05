import { Node, mergeAttributes } from '@tiptap/core'

export interface PdfOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pdf: {
      setPdf: (options: { src: string }) => ReturnType
    }
  }
}

export const Pdf = Node.create<PdfOptions>({
  name: 'pdf',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg border', // Added class for responsiveness and basic styling
        type: 'application/pdf',
        width: '100%', // Ensure it takes full width of its container
        height: '500px', // Default height, can be adjusted via attributes or CSS
      },
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      height: { // Allow height customization
        default: '500px',
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'embed[type="application/pdf"]',
      },
      {
        tag: 'iframe[src$=".pdf"]', // Basic check for iframe embedding PDF
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // Using 'embed' for wider compatibility, could also use 'iframe'
    // Merge provided HTMLAttributes with default options, allowing overrides
    const finalAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
    return ['embed', finalAttributes]
  },

  addCommands() {
    return {
      setPdf: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
