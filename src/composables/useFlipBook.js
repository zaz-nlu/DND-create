import { ref, nextTick } from 'vue'
import { PageFlip } from 'page-flip'

/**
 * 封装 StPageFlip 的命令式生命周期。
 * 全项目只有此文件能 import 'page-flip' / 碰 PageFlip 实例 / 调 querySelector。
 *
 * @param {import('vue').Ref<HTMLElement|null>} containerRef  翻页容器 DOM ref
 * @param {object} opts
 * @param {string} opts.pageSelector  页节点选择器，如 '.flip-page'
 * @param {(pageIndex:number)=>void} opts.onFlip  翻页时回调（StPageFlip 'flip' 事件，data=页码）
 * @param {()=>void} [opts.onFlipStart]  翻页开始回调（用于关闭施法弹窗）
 * @returns {{ currentPage: import('vue').Ref<number>, ok: import('vue').Ref<boolean>, init: Function, destroy: Function, flipTo: Function }}
 */
export function useFlipBook(containerRef, { pageSelector, onFlip, onFlipStart }) {
  const currentPage = ref(0)
  const ok = ref(false) // 初始化是否成功；false 时调用方降级为滚动列表
  let pageFlip = null

  async function init() {
    await nextTick() // 确保 Vue 已渲染出页节点
    const el = containerRef.value
    if (!el) return
    const pages = el.querySelectorAll(pageSelector)
    if (!pages.length) return
    try {
      pageFlip = new PageFlip(el, {
        // width/height 是必填基准比例；size:'stretch' 时在 min/max 间自适应容器。
        // 缺省会抛 "Invalid width or height" 并导致初始化失败。
        width: 390,
        height: 600,
        size: 'stretch',
        minWidth: 280,
        maxWidth: 600,
        minHeight: 360,
        maxHeight: 900,
        usePortrait: true,
        showCover: false,
        maxShadowOpacity: 0.5,
        mobileScrollSupport: true,
        disableFlipByClick: true, // 点法术卡不触发翻页，只拖拽/书签翻
        flippingTime: 700,
      })
      pageFlip.loadFromHTML(pages)
      pageFlip.on('flip', e => {
        currentPage.value = e.data
        onFlip?.(e.data)
      })
      if (onFlipStart) {
        pageFlip.on('changeState', e => {
          if (e.data === 'flipping') onFlipStart()
        })
      }
      ok.value = true
    } catch (err) {
      // 初始化失败 → 降级：调用方用普通滚动列表，不白屏
      console.warn('翻页初始化失败，降级为滚动列表。', err)
      ok.value = false
      pageFlip = null
    }
  }

  /**
   * 跳到指定页。
   * @param {number} index   页节点索引（0-based）
   * @param {{ animated?: boolean }} [o]
   */
  function flipTo(index, { animated = true } = {}) {
    if (!pageFlip) return
    if (animated) pageFlip.flip(index)
    else pageFlip.turnToPage(index)
    currentPage.value = index
  }

  function destroy() {
    if (pageFlip) {
      try { pageFlip.destroy() } catch { /* 已销毁则忽略 */ }
      pageFlip = null
    }
    ok.value = false
  }

  return { currentPage, ok, init, destroy, flipTo }
}
