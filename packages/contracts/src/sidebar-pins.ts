import { z } from "zod";
import { SpaceId } from "./ids.js";
import { SpaceSummary } from "./domain.js";

export const IN_SPACE_SIDEBAR_ITEM_LIMIT = 7;

export const SidebarSectionItemLimit = z.union([
  z.literal(5),
  z.literal(7),
  z.literal(15),
  z.literal(30),
  z.literal(50),
]);
export type SidebarSectionItemLimit = z.infer<typeof SidebarSectionItemLimit>;

export const SidebarPinDto = z.object({
  spaceId: SpaceId,
  pinnedAt: z.string().datetime(),
  space: SpaceSummary,
});
export type SidebarPinDto = z.infer<typeof SidebarPinDto>;

export const ListSidebarPinsResponse = z.object({
  pins: z.array(SidebarPinDto),
});
export type ListSidebarPinsResponse = z.infer<typeof ListSidebarPinsResponse>;

export const PinSidebarSpaceResponse = z.object({
  pin: SidebarPinDto,
});
export type PinSidebarSpaceResponse = z.infer<typeof PinSidebarSpaceResponse>;

export const SidebarSectionPreferenceDto = z.object({
  spaceId: SpaceId,
  itemLimit: SidebarSectionItemLimit,
});
export type SidebarSectionPreferenceDto = z.infer<typeof SidebarSectionPreferenceDto>;

export const ListSidebarSectionPreferencesResponse = z.object({
  preferences: z.array(SidebarSectionPreferenceDto),
});
export type ListSidebarSectionPreferencesResponse = z.infer<
  typeof ListSidebarSectionPreferencesResponse
>;

export const PutSidebarSectionPreferenceInput = z.object({
  itemLimit: SidebarSectionItemLimit,
});
export type PutSidebarSectionPreferenceInput = z.infer<typeof PutSidebarSectionPreferenceInput>;

export const PutSidebarSectionPreferenceResponse = z.object({
  preference: SidebarSectionPreferenceDto,
});
export type PutSidebarSectionPreferenceResponse = z.infer<
  typeof PutSidebarSectionPreferenceResponse
>;

/** @deprecated Use SidebarPinDto */
export const SidebarPinView = SidebarPinDto;
export type SidebarPinView = SidebarPinDto;

/** @deprecated Use SidebarSectionPreferenceDto */
export const SidebarSectionPreference = SidebarSectionPreferenceDto;
export type SidebarSectionPreference = SidebarSectionPreferenceDto;

/** @deprecated Use PutSidebarSectionPreferenceInput */
export const UpdateSidebarSectionPreferenceInput = PutSidebarSectionPreferenceInput;
export type UpdateSidebarSectionPreferenceInput = PutSidebarSectionPreferenceInput;
