import { createContext, useContext, useState, useCallback } from 'react'
import Icon from '../components/ui/Icon'

/* ---- Notifications (toasts) ---- */
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

/* ---- Confirmation (remplace window.confirm) ---- */
const ConfirmCtx = createContext(async () => false)
export const useConfirm = () => useContext(ConfirmCtx)

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null)

  const toast = useCallback((msg, type = 'ok') => {
    const id = Math.random()
    setToasts(l => [...l, { id, msg, type }])
    setTimeout(() => setToasts(l => l.filter(x => x.id !== id)), 3000)
  }, [])
  const confirm = useCallback(opts => new Promise(res => setModal({ ...opts, res })), [])
  const close = v => { modal.res(v); setModal(null) }

  return (
    <ToastCtx.Provider value={toast}>
      <ConfirmCtx.Provider value={confirm}>
        {children}
        <div className="toasts noprint" role="status" aria-live="polite">
          {toasts.map(t => (
            <div key={t.id} className={'toast ' + t.type}>
              <Icon name={t.type === 'err' ? 'alert' : 'checkc'} size={18} />{t.msg}
            </div>
          ))}
        </div>
        {modal && (
          <div className="overlay noprint" onClick={() => close(false)}>
            <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
              <div className={'modal-ic ' + (modal.danger ? 'danger' : '')}><Icon name={modal.danger ? 'alert' : 'info'} size={26} /></div>
              <h3>{modal.title}</h3>
              <p>{modal.text}</p>
              <div className="modal-b">
                <button className="btn" onClick={() => close(false)}>Annuler</button>
                <button className={'btn ' + (modal.danger ? 'danger' : 'p')} onClick={() => close(true)}>{modal.ok || 'Confirmer'}</button>
              </div>
            </div>
          </div>
        )}
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  )
}
