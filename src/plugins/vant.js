// 按需全局引入 vant组件
import Vue from 'vue'
import {
  Field,
  Dialog,
  Icon,
  NavBar,
  Button,
  List,
  CellGroup,
  Cell,
  Tabbar,
  TabbarItem,
  NoticeBar,
  Circle,
  Swipe,
  SwipeItem,
  ActionSheet,
  Popup,
  Image,
  Loading
} from 'vant'
Vue.use(Button)
Vue.use(Cell)
Vue.use(List)
Vue.use(Tabbar)
  .use(TabbarItem)
  .use(NoticeBar)
  .use(Circle)
  .use(Swipe)
  .use(SwipeItem)
  .use(ActionSheet)
  .use(CellGroup)
  .use(NavBar)
  .use(Icon)
  .use(Popup)
  .use(Image)
  .use(Loading)
  .use(Dialog)
  .use(Field)
