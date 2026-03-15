import { splitProps, type ComponentProps } from "solid-js"
import { iconNameToTablerSlug, tablerIconSnippets } from "./tabler-icon-snippets"

export type IconName = keyof typeof iconNameToTablerSlug

export interface IconProps extends ComponentProps<"svg"> {
  name: IconName
  size?: "small" | "normal" | "medium" | "large"
}

export function Icon(props: IconProps) {
  const [local, others] = splitProps(props, ["name", "size", "class", "classList"])
  const slug = iconNameToTablerSlug[local.name]
  const inner = slug ? tablerIconSnippets[slug] : undefined
  return (
    <div data-component="icon" data-size={local.size || "normal"}>
      <svg
        data-slot="icon-svg"
        classList={{
          ...(local.classList || {}),
          [local.class ?? ""]: !!local.class,
        }}
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24"
        innerHTML={inner}
        aria-hidden="true"
        {...others}
      />
    </div>
  )
}
