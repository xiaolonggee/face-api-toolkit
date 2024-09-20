/**
 * 基础路由
 * @type { *[] }
 */
export const constantRouterMap = [
  {
    path: '/',
    component: () => import('@/views/layouts/index'),
    redirect: '/home',
    meta: {
      title: '首页',
      keepAlive: false
    },
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/home/index'),
        meta: { title: '首页', keepAlive: false }
      },
      {
        path: '/about',
        name: 'About',
        component: () => import('@/views/home/about'),
        meta: { title: '关于我', keepAlive: false }
      },
      {
        path: '/bioassay',
        name: 'BioassaySet',
        component: () => import('@/views/home/bioassay'),
        meta: { title: '活体检测', keepAlive: false }
      },
      {
        path: '/faceDetection',
        name: 'FaceDetection',
        component: () => import('@/views/home/face-detection'),
        meta: { title: '1:N', keepAlive: false }
      },
      {
        path: '/faceStore',
        name: 'FaceStore',
        component: () => import('@/views/home/face-store'),
        meta: { title: '人脸库管理', keepAlive: false }
      },
      {
        path: '/faceInput',
        name: 'FaceInput',
        component: () => import('@/views/home/face-store'),
        meta: { title: '人脸录入', keepAlive: false }
      }
    ]
  }
]
