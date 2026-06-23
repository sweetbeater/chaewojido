import { useState, useRef, useEffect } from 'react'

// 네이티브 사진첩 열기 + "사진 불러오는 중" 로딩 상태 관리.
// 사진첩이 닫힌 뒤(window focus) onChange가 불릴 때까지의 빈 구간을 메우고,
// 취소(input cancel 이벤트) 또는 안전장치 타임아웃으로 로딩이 멈춰있지 않게 해제한다.
//
// inputRef: 대상 <input type="file"> 의 ref
// active:   리스너를 붙일지 여부 (input이 조건부로 마운트되는 화면에서 사용)
export function usePhotoPicker(inputRef, active = true) {
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const pickerOpenRef = useRef(false)
  const timerRef = useRef(null)

  // 로딩 해제 + 모든 플래그/타이머 정리. cancel 이벤트와 onChange 양쪽에서 호출.
  const stopLoading = () => {
    pickerOpenRef.current = false
    clearTimeout(timerRef.current)
    setLoadingPhotos(false)
  }

  const openPicker = () => {
    pickerOpenRef.current = true
    inputRef.current?.click()
  }

  useEffect(() => {
    if (!active) return
    const onFocus = () => {
      if (!pickerOpenRef.current) return
      setLoadingPhotos(true)
      // cancel 이벤트를 지원하지 않는 구형 환경에서도 멈춰있지 않도록 하는 안전장치.
      // 15초는 사진 다수를 불러오는 정상 처리 시간보다 길어, 실제 로딩을 끊지 않는다.
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(stopLoading, 15000)
    }
    const input = inputRef.current
    window.addEventListener('focus', onFocus)
    input?.addEventListener('cancel', stopLoading)
    return () => {
      window.removeEventListener('focus', onFocus)
      input?.removeEventListener('cancel', stopLoading)
      clearTimeout(timerRef.current)
    }
  }, [active, inputRef])

  return { loadingPhotos, openPicker, stopLoading }
}
