import { Select as Kobalte } from "@kobalte/core/select"
import { createMemo, createSignal, onCleanup, Show, splitProps, type ComponentProps, type JSX } from "solid-js"
import { pipe, groupBy, entries, map } from "remeda"
import fuzzysort from "fuzzysort"
import { Button, ButtonProps } from "./button"
import { Icon } from "./icon"

export type SelectProps<T> = Omit<ComponentProps<typeof Kobalte<T>>, "value" | "onSelect" | "children"> & {
  placeholder?: string
  options: T[]
  current?: T
  value?: (x: T) => string
  label?: (x: T) => string
  groupBy?: (x: T) => string
  valueClass?: ComponentProps<"div">["class"]
  onSelect?: (value: T | undefined) => void
  onHighlight?: (value: T | undefined) => (() => void) | void
  class?: ComponentProps<"div">["class"]
  classList?: ComponentProps<"div">["classList"]
  children?: (item: T | undefined) => JSX.Element
  triggerStyle?: JSX.CSSProperties
  triggerVariant?: "settings"
  triggerProps?: Record<string, string | number | boolean | undefined>
  searchable?: boolean
  searchPlaceholder?: string
}

export function Select<T>(props: SelectProps<T> & Omit<ButtonProps, "children">) {
  const [local, others] = splitProps(props, [
    "class",
    "classList",
    "placeholder",
    "options",
    "current",
    "value",
    "label",
    "groupBy",
    "valueClass",
    "onSelect",
    "onHighlight",
    "onOpenChange",
    "children",
    "triggerStyle",
    "triggerVariant",
    "triggerProps",
    "searchable",
    "searchPlaceholder",
  ])

  const [search, setSearch] = createSignal("")

  const state = {
    key: undefined as string | undefined,
    cleanup: undefined as (() => void) | void,
  }

  const stop = () => {
    state.cleanup?.()
    state.cleanup = undefined
    state.key = undefined
  }

  const keyFor = (item: T) => (local.value ? local.value(item) : (item as string))

  const move = (item: T | undefined) => {
    if (!local.onHighlight) return
    if (!item) {
      stop()
      return
    }

    const key = keyFor(item)
    if (state.key === key) return
    state.cleanup?.()
    state.cleanup = local.onHighlight(item)
    state.key = key
  }

  onCleanup(stop)

  const filtered = createMemo(() => {
    const query = search().trim()
    if (!local.searchable || !query) return local.options

    const results = fuzzysort.go(query, local.options, {
      key: (x) => (local.label ? local.label(x) : (x as string)),
      threshold: -10000,
    })

    return results.map((r) => r.obj)
  })

  const grouped = createMemo(() => {
    const result = pipe(
      filtered(),
      groupBy((x) => (local.groupBy ? local.groupBy(x) : "")),
      entries(),
      map(([k, v]) => ({ category: k, options: v })),
    )
    return result
  })

  return (
    // @ts-ignore
    <Kobalte<T, { category: string; options: T[] }>
      {...others}
      data-component="select"
      data-trigger-style={local.triggerVariant}
      placement={local.triggerVariant === "settings" ? "bottom-end" : "bottom-start"}
      gutter={4}
      value={local.current}
      options={grouped()}
      optionValue={(x) => (local.value ? local.value(x) : (x as string))}
      optionTextValue={(x) => (local.label ? local.label(x) : (x as string))}
      optionGroupChildren="options"
      placeholder={local.placeholder}
      sectionComponent={(local) => (
        <Kobalte.Section data-slot="select-section">{local.section.rawValue.category}</Kobalte.Section>
      )}
      itemComponent={(itemProps) => (
        <Kobalte.Item
          {...itemProps}
          data-slot="select-select-item"
          classList={{
            ...(local.classList ?? {}),
            [local.class ?? ""]: !!local.class,
          }}
          onPointerEnter={() => move(itemProps.item.rawValue)}
          onPointerMove={() => move(itemProps.item.rawValue)}
          onFocus={() => move(itemProps.item.rawValue)}
        >
          <Kobalte.ItemLabel data-slot="select-select-item-label">
            {local.children
              ? local.children(itemProps.item.rawValue)
              : local.label
                ? local.label(itemProps.item.rawValue)
                : (itemProps.item.rawValue as string)}
          </Kobalte.ItemLabel>
          <Kobalte.ItemIndicator data-slot="select-select-item-indicator">
            <Icon name="check-small" size="small" />
          </Kobalte.ItemIndicator>
        </Kobalte.Item>
      )}
      onChange={(v) => {
        local.onSelect?.(v ?? undefined)
        stop()
      }}
      onOpenChange={(open) => {
        local.onOpenChange?.(open)
        if (!open) {
          stop()
          setSearch("")
        }
      }}
    >
      <Kobalte.Trigger
        {...local.triggerProps}
        disabled={props.disabled}
        data-slot="select-select-trigger"
        as={Button}
        size={props.size}
        variant={props.variant}
        style={local.triggerStyle}
        classList={{
          ...(local.classList ?? {}),
          [local.class ?? ""]: !!local.class,
        }}
      >
        <Kobalte.Value<T> data-slot="select-select-trigger-value" class={local.valueClass}>
          {(state) => {
            const selected = state.selectedOption() ?? local.current
            if (!selected) return local.placeholder || ""
            if (local.label) return local.label(selected)
            return selected as string
          }}
        </Kobalte.Value>
        <Kobalte.Icon data-slot="select-select-trigger-icon">
          <Icon name={local.triggerVariant === "settings" ? "selector" : "chevron-down"} size="small" />
        </Kobalte.Icon>
      </Kobalte.Trigger>
      <Kobalte.Portal>
        <Kobalte.Content
          classList={{
            ...(local.classList ?? {}),
            [local.class ?? ""]: !!local.class,
          }}
          data-component="select-content"
          data-trigger-style={local.triggerVariant}
        >
          <Show when={local.searchable}>
            <div class="px-2 pt-2 pb-1" data-slot="select-search-container">
              <div class="relative flex items-center">
                <div class="absolute left-2.5 text-text-weak">
                  <Icon name="magnifying-glass" size="small" />
                </div>
                <input
                  class="w-full bg-surface-raised-base border border-border-weak rounded-md py-1.5 pl-8 pr-2.5 text-12-regular text-text-strong placeholder:text-text-weak outline-none focus:border-border-base transition-colors"
                  type="text"
                  placeholder={local.searchPlaceholder || "Search..."}
                  value={search()}
                  onInput={(e) => setSearch(e.currentTarget.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  autofocus
                />
              </div>
            </div>
          </Show>
          <Kobalte.Listbox data-slot="select-select-content-list" />
        </Kobalte.Content>
      </Kobalte.Portal>
    </Kobalte>
  )
}
