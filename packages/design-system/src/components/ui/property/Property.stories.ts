import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Badge } from "@/components/ui/badge";
import { ref } from "vue";
import { PropertyList, PropertyRow, PropertyTypeIcon, type PropertyDefinition, type PropertyType } from "./index";

const meta = {
  title: "primitives/Property",
  component: PropertyList,
  tags: ["autodocs"],
} satisfies Meta<typeof PropertyList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotionStyleProperties: Story = {
  render: () => ({
    components: { PropertyList, PropertyRow, PropertyTypeIcon, Badge },
    setup() {
      const properties = ref<PropertyDefinition[]>([
        {
          id: "prop-1" as any,
          key: "priority",
          name: "Priority",
          type: "select",
          options: [
            { id: "high", name: "High", color: "#f97316" },
            { id: "medium", name: "Medium", color: "#eab308" },
          ],
          order: 0,
        },
        {
          id: "prop-2" as any,
          key: "assignee",
          name: "Assignee",
          type: "person",
          order: 1,
        },
        {
          id: "prop-3" as any,
          key: "labels",
          name: "Labels",
          type: "multi_select",
          order: 2,
        },
        {
          id: "prop-4" as any,
          key: "parent_epic",
          name: "Parent Epic",
          type: "relation",
          order: 3,
        },
        {
          id: "prop-5" as any,
          key: "estimate",
          name: "Estimate",
          type: "number",
          order: 4,
        },
      ]);

      const values = ref<Record<string, any>>({
        priority: "High",
        assignee: "Alice Smith",
        labels: ["Frontend", "Security"],
        parent_epic: "Auth & Permissions Overhaul",
        estimate: 5,
      });

      function onAddProperty(type: PropertyType) {
        const id = `prop-${Date.now()}` as any;
        properties.value.push({
          id,
          key: `prop_${Date.now()}`,
          name: `New ${type}`,
          type,
          order: properties.value.length,
        });
      }

      function onDeleteProperty(id: string) {
        properties.value = properties.value.filter((p) => p.id !== id);
      }

      return {
        properties,
        values,
        onAddProperty,
        onDeleteProperty,
      };
    },
    template: `
      <div class="max-w-xl rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 class="mb-4 text-xl font-semibold tracking-tight">Implement auth token refresh</h1>
        
        <PropertyList @add-property="onAddProperty">
          <PropertyRow
            v-for="prop in properties"
            :key="prop.id"
            :property="prop"
            @delete="onDeleteProperty(prop.id)"
          >
            <template v-if="prop.key === 'priority'">
              <span class="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <span class="size-1.5 rounded-full bg-amber-500"></span>
                {{ values.priority }}
              </span>
            </template>
            <template v-else-if="prop.key === 'assignee'">
              <div class="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span class="inline-flex size-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">A</span>
                {{ values.assignee }}
              </div>
            </template>
            <template v-else-if="prop.key === 'labels'">
              <div class="flex flex-wrap gap-1">
                <Badge v-for="tag in values.labels" :key="tag" variant="secondary" class="text-xs">
                  {{ tag }}
                </Badge>
              </div>
            </template>
            <template v-else-if="prop.key === 'parent_epic'">
              <span class="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline cursor-pointer">
                📁 {{ values.parent_epic }}
              </span>
            </template>
            <template v-else-if="prop.key === 'estimate'">
              <span class="text-xs font-mono text-muted-foreground">{{ values.estimate }} pts</span>
            </template>
            <template v-else>
              <span class="text-xs text-muted-foreground italic">Empty</span>
            </template>
          </PropertyRow>
        </PropertyList>

        <div class="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          <p>Document body content starts here...</p>
        </div>
      </div>
    `,
  }),
};
