import { createRouter, createWebHistory } from 'vue-router'
import AdminView        from '../views/AdminView.vue'
import BookCover        from '../views/BookCover.vue'
import SetupView        from '../views/SetupView.vue'
import RaceSelect       from '../views/RaceSelect.vue'
import BackgroundSelect from '../views/BackgroundSelect.vue'
import ClassSelect      from '../views/ClassSelect.vue'
import FeatsView        from '../views/FeatsView.vue'
import SpellsView       from '../views/SpellsView.vue'
import AbilityBaseView  from '../views/AbilityBaseView.vue'
import AbilityScores    from '../views/AbilityScores.vue'
import HpSetup          from '../views/HpSetup.vue'
import EquipmentView    from '../views/EquipmentView.vue'
import CharacterSheet   from '../views/CharacterSheet.vue'
import PrintSheet       from '../views/PrintSheet.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',            component: BookCover        },
    { path: '/setup',       component: SetupView        },
    { path: '/ability-base', component: AbilityBaseView  },
    { path: '/race',        component: RaceSelect       },
    { path: '/class',       component: ClassSelect      },
    { path: '/background',  component: BackgroundSelect },
    { path: '/feats',       component: FeatsView        },
    { path: '/spells',      component: SpellsView       },
    { path: '/abilities',   component: AbilityScores    },
    { path: '/equipment',   component: EquipmentView    },
    { path: '/hp',          component: HpSetup          },
    { path: '/sheet',       component: CharacterSheet   },
    { path: '/print',       component: PrintSheet       },
    { path: '/admin',       component: AdminView        },
  ],
})
