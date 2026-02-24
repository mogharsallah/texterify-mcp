import { z } from "zod"

// ── Enums / Unions (from Texterify frontend) ────────────────────

export type IFeature =
  | "FEATURE_VALIDATIONS"
  | "FEATURE_KEY_HISTORY"
  | "FEATURE_EXPORT_HIERARCHY"
  | "FEATURE_POST_PROCESSING"
  | "FEATURE_PROJECT_ACTIVITY"
  | "FEATURE_ADVANCED_PERMISSION_SYSTEM"
  | "FEATURE_OTA"
  | "FEATURE_HTML_EDITOR"
  | "FEATURE_TEMPLATES"
  | "FEATURE_PROJECT_GROUPS"
  | "FEATURE_MACHINE_TRANSLATION_SUGGESTIONS"
  | "FEATURE_MACHINE_TRANSLATION_LANGUAGE"
  | "FEATURE_MACHINE_TRANSLATION_AUTO_TRANSLATE"
  | "FEATURE_TAGS"

export type IPlanIDS = "free" | "basic" | "team" | "business"

export type IUserRole = "translator" | "developer" | "manager" | "owner"

// ── Errors (from Texterify frontend ErrorUtils.ts) ──────────────

export type ErrorMessageId = "INVALID" | "TAKEN" | "NOT_FOUND" | "BLANK" | "KEY_NAME_RESERVED"

export interface IError {
  error: ErrorMessageId
}

export interface IErrorsResponse {
  [field: string]: IError[]
}

// ── Keys ────────────────────────────────────────────────────────

export interface IKey {
  id: string
  type: "key"
  attributes: {
    id: string
    project_id: string
    name: string
    description: string | null
    html_enabled: boolean
    pluralization_enabled: boolean
    name_editable: boolean
    editable_for_current_user: boolean
    created_at: string
    updated_at: string
  }
  relationships: {
    translations: { data: Array<{ id: string; type: "translation" }> }
    tags: { data: Array<{ id: string; type: "tag" }> }
    wordpress_contents: { data: Array<{ id: string; type: "wordpress_content" }> }
  }
}

export interface IPlaceholder {
  id: string
  type: "placeholder"
  attributes: { id: string; name: string }
}

export type IKeyIncluded = Array<ITranslation | ILanguage | ITag | IPlaceholder>

export interface IGetKeysResponse {
  data: IKey[]
  included: IKeyIncluded
  meta: { total: number }
}

export interface IGetKeyResponse {
  data: IKey
  included: IKeyIncluded
  meta: { total: number }
}

export interface ICreateKeyResponse {
  data: IKey
  included: Array<ITranslation | ILanguage | IPlaceholder>
  errors: IErrorsResponse
}

// ── Translations ────────────────────────────────────────────────

export interface ITranslation {
  id: string
  type: "translation"
  attributes: {
    id: string
    key_id: string
    language_id: string
    zero: string
    one: string
    two: string
    few: string
    many: string
    content: string
    created_at: string
  }
  relationships: {
    flavor?: { data: unknown }
    key?: { data: unknown }
    language?: { data: unknown }
  }
}

// ── Languages ───────────────────────────────────────────────────

export interface ILanguageCode {
  id: string
  type: "language_code"
  attributes: { id: string; name: string; code: string }
}

export interface ICountryCode {
  id: string
  type: "country_code"
  attributes: { id: string; name: string; code: string }
}

export interface ILanguage {
  id: string
  type: "language"
  attributes: {
    id: string
    name: string
    is_default: boolean
    supports_plural_zero: string
    supports_plural_one: string
    supports_plural_two: string
    supports_plural_few: string
    supports_plural_many: string
    progress: number
  }
  relationships: {
    country_code: { data: null | { id: string; type: "country_code" } }
    language_code: { data: null | { id: string; type: "language_code" } }
    parent: { data: null | { id: string; type: "language" } }
  }
}

export interface IGetLanguagesResponse {
  data: ILanguage[]
  included: ILanguageCode[]
  meta: { total: number }
}

// ── Projects ────────────────────────────────────────────────────

export interface IProjectAttributes {
  id: string
  name: string
  description: string
  current_user_role?: IUserRole
  current_user_role_source?: "project" | "organization"
  enabled_features: IFeature[]
  all_features: { [k in IFeature]: IPlanIDS[] }
  machine_translation_active: boolean
  machine_translation_enabled: boolean
  machine_translation_character_usage: number
  auto_translate_new_keys: boolean
  auto_translate_new_languages: boolean
  word_count: number
  character_count: number
  placeholder_start: string
  placeholder_end: string
  issues_count: number
  validate_leading_whitespace: boolean
  validate_trailing_whitespace: boolean
  validate_double_whitespace: boolean
  validate_https: boolean
  current_user_deactivated?: boolean
  current_user_deactivated_reason?: "manually_by_admin" | "user_limit_exceeded"
  current_user_in_project_organization?: boolean
  current_user_in_project?: boolean
  organization_id: string
}

export interface IProject {
  id: string
  type: string
  attributes: IProjectAttributes
  relationships: Record<string, unknown>
}

export interface IGetProjectsResponse {
  data: IProject[]
  meta: { total: number }
}

// ── Tags ────────────────────────────────────────────────────────

export interface ITag {
  id: string
  type: "tag"
  attributes: {
    id: string
    name: string
    custom: boolean
    disable_translation_for_translators: boolean
  }
  relationships: {
    keys: { data: null | { id: string; type: "key" } }
  }
}

// ── Zod Input Schemas ───────────────────────────────────────────

const projectIdField = z
  .string()
  .min(1)
  .optional()
  .describe(
    "The Texterify project UUID. If omitted, uses the TEXTERIFY_PROJECT_ID environment variable. You can find this value in the project's texterify.json file under the 'project_id' field",
  )

const paginationSchema = {
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      "Page number, starting from 1 (default: 1). Use meta.total from the response to determine total pages",
    ),
  per_page: z
    .number()
    .int()
    .positive()
    .max(50)
    .optional()
    .describe("Number of results per page (default: 10, max: 50)"),
}

export const listKeysInputSchema = z.object({
  project_id: projectIdField,
  search: z
    .string()
    .optional()
    .describe(
      "Filter keys by name, description, or translation content (case-insensitive substring match)",
    ),
  only_untranslated: z
    .boolean()
    .optional()
    .describe(
      "If true, return only keys that have missing translations for one or more project languages. Useful for finding gaps in localization coverage",
    ),
  ...paginationSchema,
})

export const getKeyInputSchema = z.object({
  project_id: projectIdField,
  key_id: z
    .string()
    .min(1)
    .describe(
      "The UUID of the key to retrieve. Get this from the `data[].id` field in list_keys responses",
    ),
})

export const createKeyInputSchema = z.object({
  project_id: projectIdField,
  name: z
    .string()
    .min(1)
    .describe(
      "The key name used as the i18n identifier in source code, typically in snake_case or dot.notation (e.g., 'welcome_message', 'auth.login.title'). Must be unique within the project",
    ),
  description: z
    .string()
    .optional()
    .describe(
      "Optional human-readable description to help translators understand the context (e.g., 'Greeting shown on the homepage header'). This is not the translation — it's metadata about where/how the key is used",
    ),
  html_enabled: z
    .boolean()
    .optional()
    .describe(
      "Set to true if translation values for this key contain HTML markup. When enabled, the Texterify UI shows a rich text editor for translators. Defaults to false",
    ),
  pluralization_enabled: z
    .boolean()
    .optional()
    .describe(
      "Set to true if this key needs plural forms (e.g., '1 item' vs '5 items'). Follows CLDR Plural Rules with forms: zero, one, two, few, many, and other (the content field). When enabled, use the plural parameters in set_translation. Defaults to false",
    ),
})

export const updateKeyInputSchema = z.object({
  project_id: projectIdField,
  key_id: z
    .string()
    .min(1)
    .describe("The UUID of the key to update. Get this from list_keys or get_key responses"),
  name: z
    .string()
    .min(1)
    .optional()
    .describe("New key name. Must be unique within the project. Omit to leave unchanged"),
  description: z
    .string()
    .optional()
    .describe("New description to help translators understand context. Omit to leave unchanged"),
  html_enabled: z
    .boolean()
    .optional()
    .describe(
      "Whether translation values for this key can contain HTML markup. Omit to leave unchanged",
    ),
  pluralization_enabled: z
    .boolean()
    .optional()
    .describe(
      "Whether this key supports CLDR plural forms (zero, one, two, few, many). Omit to leave unchanged",
    ),
})

export const deleteKeysInputSchema = z.object({
  project_id: projectIdField,
  key_ids: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Array of one or more key UUIDs to delete. Get these from the `data[].id` field in list_keys responses. All keys and their translations across every language are permanently removed",
    ),
})

export const setTranslationInputSchema = z.object({
  project_id: projectIdField,
  key_id: z
    .string()
    .min(1)
    .describe(
      "The UUID of the translation key. Get this from list_keys, get_key, or create_key response `data.id`",
    ),
  language_id: z
    .string()
    .min(1)
    .describe(
      "The UUID of the target language. Get this from the `data[].id` field in list_languages responses",
    ),
  content: z
    .string()
    .min(1)
    .describe(
      "The translated text. This is the main translation value and also serves as the 'other' plural form when pluralization is enabled on the key",
    ),
  zero: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for zero quantity (e.g., 'No items'). Only relevant when the key has pluralization_enabled and the language supports this form (check supports_plural_zero from list_languages)",
    ),
  one: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for singular quantity (e.g., '1 item'). Only relevant when the key has pluralization_enabled and the language supports this form",
    ),
  two: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for dual quantity (e.g., '2 items'). Only relevant for languages with a dual form (e.g., Arabic, Slovenian)",
    ),
  few: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for few quantity (e.g., '3 items'). Only relevant for languages with a paucal form (e.g., Polish, Czech, Arabic)",
    ),
  many: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for many quantity (e.g., '5 items'). Only relevant for languages with this form (e.g., Polish, Arabic, Welsh)",
    ),
})

const translationEntrySchema = z.object({
  language_code: z
    .string()
    .min(1)
    .describe(
      "The language code (e.g., 'en', 'de', 'fr') identifying the target language. Must match a language_code configured in the project (see list_languages included[].attributes.code)",
    ),
  content: z
    .string()
    .min(1)
    .describe(
      "The translated text. This is the main translation value and also serves as the 'other' plural form when pluralization is enabled on the key",
    ),
  zero: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for zero quantity (e.g., 'No items'). Only relevant when pluralization_enabled is true and the language supports this form",
    ),
  one: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for singular quantity (e.g., '1 item'). Only relevant when pluralization_enabled is true and the language supports this form",
    ),
  two: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for dual quantity (e.g., '2 items'). Only relevant for languages with a dual form (e.g., Arabic, Slovenian)",
    ),
  few: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for few quantity (e.g., '3 items'). Only relevant for languages with a paucal form (e.g., Polish, Czech, Arabic)",
    ),
  many: z
    .string()
    .optional()
    .describe(
      "CLDR plural form for many quantity (e.g., '5 items'). Only relevant for languages with this form (e.g., Polish, Arabic, Welsh)",
    ),
})

export const createKeyWithTranslationsInputSchema = z.object({
  project_id: projectIdField,
  name: z
    .string()
    .min(1)
    .describe(
      "The key name used as the i18n identifier in source code, typically in snake_case or dot.notation (e.g., 'welcome_message', 'auth.login.title'). Must be unique within the project",
    ),
  description: z
    .string()
    .optional()
    .describe(
      "Optional human-readable description to help translators understand the context (e.g., 'Greeting shown on the homepage header'). This is not the translation — it's metadata about where/how the key is used",
    ),
  html_enabled: z
    .boolean()
    .optional()
    .describe(
      "Set to true if translation values for this key contain HTML markup. When enabled, the Texterify UI shows a rich text editor for translators. Defaults to false",
    ),
  pluralization_enabled: z
    .boolean()
    .optional()
    .describe(
      "Set to true if this key needs plural forms (e.g., '1 item' vs '5 items'). Follows CLDR Plural Rules with forms: zero, one, two, few, many, and other (the content field). Defaults to false",
    ),
  translations: z
    .array(translationEntrySchema)
    .min(1)
    .describe(
      "Array of translations to set for the new key. Each entry specifies a language_code and the translated content. The tool resolves language codes to IDs internally by fetching the project's configured languages",
    ),
})

export const listLanguagesInputSchema = z.object({
  project_id: projectIdField,
  search: z
    .string()
    .optional()
    .describe("Filter languages by name (case-insensitive substring match)"),
  ...paginationSchema,
})

export const listProjectsInputSchema = z.object({
  search: z
    .string()
    .optional()
    .describe("Filter projects by name (case-insensitive substring match)"),
  ...paginationSchema,
})
