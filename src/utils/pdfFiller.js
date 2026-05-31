// PDF填充功能模块
// 使用 pdf-lib 来填充PDF表单字段

import { PDFDocument, rgb } from 'pdf-lib'
import { generatePdfData } from './pdfMapping.js'

/**
 * 加载本地PDF文件
 */
async function loadPdfFromAssets(filename) {
  try {
    // 尝试多个可能的路径
    const paths = [
      `/src/assets/${filename}`,
      `/assets/${filename}`,
      `./src/assets/${filename}`,
    ]

    for (const path of paths) {
      try {
        const response = await fetch(path)
        if (response.ok) {
          return await response.arrayBuffer()
        }
      } catch (e) {
        // 继续尝试下一个路径
      }
    }
    throw new Error(`无法在任何路径中找到PDF文件: ${filename}`)
  } catch (error) {
    console.error('PDF加载失败:', error)
    throw error
  }
}

/**
 * 填充PDF表单并生成新PDF
 * @param {Object} character - 角色数据对象
 * @param {string} pdfFilename - PDF文件名（在assets中）
 * @returns {Promise<ArrayBuffer>} 填充后的PDF数据
 */
export async function fillCharacterPdf(character, pdfFilename = '5r.pdf') {
  try {
    // 1. 加载原始PDF
    const pdfBuffer = await loadPdfFromAssets(pdfFilename)
    const pdfDoc = await PDFDocument.load(pdfBuffer)

    // 2. 生成要填充的数据
    const pdfData = generatePdfData(character)

    // 3. 获取表单
    const form = pdfDoc.getForm()

    // 4. 填充所有字段
    Object.entries(pdfData).forEach(([fieldName, value]) => {
      try {
        const field = form.getField(fieldName)
        if (!field) {
          console.warn(`PDF字段不存在: ${fieldName}`)
          return
        }

        // 根据字段类型填充
        if (fieldName.startsWith('Check Box')) {
          // 复选框
          if (value === 'Yes' || value === true) {
            field.check()
          }
        } else if (fieldName.startsWith('Text')) {
          // 文本字段
          field.setText(String(value))
        }
      } catch (error) {
        console.warn(`填充字段失败 ${fieldName}:`, error.message)
      }
    })

    // 5. 扁平化表单（使其不可编辑）
    form.flatten()

    // 6. 生成PDF
    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error('PDF填充失败:', error)
    throw error
  }
}

/**
 * 下载PDF文件
 * @param {ArrayBuffer} pdfData - PDF数据
 * @param {string} filename - 下载文件名
 */
export function downloadPdf(pdfData, filename = '角色卡.pdf') {
  const blob = new Blob([pdfData], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 生成并下载角色PDF
 * @param {Object} character - 角色数据
 * @param {string} characterName - 角色名称（用于文件名）
 */
export async function exportCharacterPdf(character, characterName = '角色卡') {
  try {
    const pdfData = await fillCharacterPdf(character)
    const filename = `${characterName}_${new Date().getTime()}.pdf`
    downloadPdf(pdfData, filename)
    return true
  } catch (error) {
    console.error('导出PDF失败:', error)
    throw error
  }
}

/**
 * 预览PDF（在新标签页打开）
 * @param {Object} character - 角色数据
 */
export async function previewCharacterPdf(character) {
  try {
    const pdfData = await fillCharacterPdf(character)
    const blob = new Blob([pdfData], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error) {
    console.error('PDF预览失败:', error)
    throw error
  }
}
