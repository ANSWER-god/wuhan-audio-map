/** 当前语料库覆盖的武汉核心城区；外围无材料城区不在地图中展示。 */
export const CORE_DISTRICTS = [
  '江岸区',
  '江汉区',
  '硚口区',
  '汉阳区',
  '武昌区',
  '青山区',
  '洪山区',
] as const

export const CORE_DISTRICT_SET: ReadonlySet<string> = new Set(CORE_DISTRICTS)
