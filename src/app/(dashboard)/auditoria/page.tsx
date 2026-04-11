'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Link as LinkIcon,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Trash2,
  Tag
} from 'lucide-react';

// TIPOS
type Consultant = { id: string; name: string };
type Category = { id: string; name: string };
type Question = { id: string; categoryId: string; title: string; tagIds?: string[] };
type Answer = { 
  amostragem: string; 
  avaliado: string; 
  conforme: string; 
  observacoes: string; 
  url: string; 
};

type TagDef = { id: string; label: string; color: string };

// DADOS INICIAIS MOCKADOS
const INITIAL_TAGS: TagDef[] = [
  { id: 't-tot', label: 'Totalidade', color: '#10b981' },
  { id: 't-30', label: '30% da carteira', color: '#3b82f6' }
];
const INITIAL_CONSULTANTS: Consultant[] = [
  { id: '1', name: 'Waldemar Lima' },
  { id: '2', name: 'Sávio Menezes' },
  { id: '3', name: 'Thyêgo Douglas' },
  { id: '4', name: 'Letícia Bezerra' },
  { id: '5', name: 'Anderson Castro' },
  { id: '6', name: 'Vinício Rocha' },
  { id: '7', name: 'Antonio Mardo' },
  { id: '8', name: 'Davi Marinho' },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: 'CLICKUP' },
  { id: 'c2', name: 'DRIVE' },
  { id: 'c3', name: 'WHATSAPP' },
  { id: 'c4', name: 'DADOS' },
  { id: 'c5', name: 'FLAGS' },
];

export default function Auditoria() {
  const [mounted, setMounted] = useState(false);

  // Estados Base
  const [consultants] = useState<Consultant[]>(INITIAL_CONSULTANTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', categoryId: 'c1', title: 'TAREFAS DO MÊS CRIADAS?' },
    { id: 'q2', categoryId: 'c1', title: 'PLANO DE AÇÃO ATUALIZADO?' }
  ]);

  // Estados Principal (65%)
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  
  const [tags, setTags] = useState<TagDef[]>(INITIAL_TAGS);
  const [activeTagDropdown, setActiveTagDropdown] = useState<string | null>(null);
  const [newTagLabel, setNewTagLabel] = useState('');

  // Estados Auditoria Rápida (35%)
  const [quickConsultant, setQuickConsultant] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickAvaliado, setQuickAvaliado] = useState('');
  const [quickConforme, setQuickConforme] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // --- Handlers Principal ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const newId = `c-${Date.now()}`;
    setCategories([...categories, { id: newId, name: newCategoryName.toUpperCase() }]);
    setNewCategoryName('');
    setActiveCategoryId(newId);
  };

  const handleRemoveCategory = (idToRemove: string) => {
    setCategories(categories.filter(c => c.id !== idToRemove));
    if (activeCategoryId === idToRemove) {
      setActiveCategoryId(categories[0]?.id || '');
    }
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionTitle.trim() || !activeCategoryId) return;
    setQuestions([
      ...questions,
      { id: `q-${Date.now()}`, categoryId: activeCategoryId, title: newQuestionTitle.toUpperCase() }
    ]);
    setNewQuestionTitle('');
  };

  const handleDeleteQuestion = (idToRemove: string) => {
    setQuestions(questions.filter(q => q.id !== idToRemove));
  };

  const handleAddTagToQuestion = (questionId: string, tagId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const currentTags = q.tagIds || [];
        if (!currentTags.includes(tagId)) {
          return { ...q, tagIds: [...currentTags, tagId] };
        }
      }
      return q;
    }));
    setActiveTagDropdown(null);
  };

  const handleRemoveTagFromQuestion = (questionId: string, tagId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, tagIds: (q.tagIds || []).filter(id => id !== tagId) };
      }
      return q;
    }));
  };

  const handleCreateAndAddTag = (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!newTagLabel.trim()) return;
    const newTagId = `t-${Date.now()}`;
    const newTagColor = '#8b5cf6';
    const newTag = { id: newTagId, label: newTagLabel, color: newTagColor };
    
    setTags([...tags, newTag]);
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, tagIds: [...(q.tagIds || []), newTagId] };
      }
      return q;
    }));
    setNewTagLabel('');
    setActiveTagDropdown(null);
  };

  const handleAnswerChange = (questionId: string, field: keyof Answer, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { amostragem: '', avaliado: '', conforme: '', observacoes: '', url: '' }),
        [field]: value
      }
    }));
  };

  // --- Handlers Rápida ---
  const handleQuickSave = () => {
    if (!quickConsultant || !quickCategory || !quickAvaliado || !quickConforme) {
      alert("Preencha todos os campos da auditoria rápida antes de salvar.");
      return;
    }
    alert(`Auditoria expressa salva com sucesso!\nConsultor: ${quickConsultant}\nAvaliações: ${quickAvaliado} | Conformes: ${quickConforme}`);
    
    setQuickConsultant('');
    setQuickCategory('');
    setQuickAvaliado('');
    setQuickConforme('');
  };

  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const activeQuestions = questions.filter(q => q.categoryId === activeCategoryId);

  return (
    <div className="auditoria-page">
      <header className="page-header">
        <h2>NOVA AUDITORIA</h2>
        <p>Formulário de avaliação mensal de conformidade estruturado.</p>
      </header>

      <div className="auditoria-grid">
        
        {/* =========================================
            ÁREA PRINCIPAL ESQUERDA (Formulário Completo)
            ========================================= */}
        <div className="main-form">
          
          {/* Seção 1 - Seleção de Consultor */}
          <section className="form-section">
            <label className="section-label">1. Selecione o Consultor</label>
            <div className="input-wrapper">
              <select 
                value={selectedConsultant}
                onChange={e => setSelectedConsultant(e.target.value)}
                className="select-input"
              >
                <option value="" disabled>Selecionar Consultor...</option>
                {consultants.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={18} className="select-icon" />
            </div>
          </section>

          {/* Seção 2 - Categorias de Auditoria */}
          <section className="form-section">
            <label className="section-label">2. Categorias de Auditoria</label>
            
            {/* Top barra: Chips de Categorias e input */}
            <div className="chips-container">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className={`chip ${activeCategoryId === cat.id ? 'chip-active' : 'chip-inactive'}`}
                  onClick={() => setActiveCategoryId(cat.id)}
                >
                  {cat.name}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveCategory(cat.id); }}
                    className="chip-remove"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </div>
              ))}
              
              <form onSubmit={handleAddCategory} className="chip-form">
                <input 
                  type="text" 
                  placeholder="Nova Categoria..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="chip-input"
                />
                <button type="submit" className="chip-add-btn">
                  <Plus size={12} strokeWidth={3} />
                </button>
              </form>
            </div>

            {/* Linha das abas ativas simulando navegação */}
            <div className="tabs-nav">
              {categories.map(cat => (
                <button
                  key={'nav-' + cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`tab-btn ${activeCategoryId === cat.id ? 'active' : ''}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Dentro da Categoria Ativa */}
            {activeCategory && (
              <div className="category-content">
                {/* Adicionar Pergunta Bar */}
                <form onSubmit={handleAddQuestion} className="add-question-bar">
                  <input 
                    type="text" 
                    placeholder={`+ Adicionar nova pergunta em ${activeCategory.name}...`}
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    className="question-input"
                  />
                  <button type="submit" className="add-question-action">
                    ADICIONAR
                  </button>
                </form>

                {/* Cards de Perguntas */}
                <div className="questions-list">
                  {activeQuestions.length === 0 && (
                    <p className="empty-message">Nenhuma pergunta configurada para esta categoria.</p>
                  )}

                  {activeQuestions.map(q => {
                    const ans = answers[q.id] || { amostragem: '', avaliado: '', conforme: '', observacoes: '', url: '' };
                    
                    return (
                      <div key={q.id} className="card question-card">
                        <div className="question-header">
                          <div className="question-title-group">
                            <ClipboardCheck size={20} className="question-icon" />
                            <h3 className="bebas-font">{q.title}</h3>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteQuestion(q.id)} 
                            className="delete-question-btn" 
                            title="Excluir pergunta"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        {/* TAGS DA PERGUNTA */}
                        <div className="question-tags-row">
                          {q.tagIds?.map(tagId => {
                            const tagDef = tags.find(t => t.id === tagId);
                            if (!tagDef) return null;
                            return (
                              <span key={tagId} className="question-tag" style={{ backgroundColor: tagDef.color }}>
                                {tagDef.label}
                                <button type="button" onClick={() => handleRemoveTagFromQuestion(q.id, tagId)}>
                                  <X size={10} strokeWidth={3} />
                                </button>
                              </span>
                            );
                          })}
                          
                          <div className="tag-dropdown-wrapper">
                            <button 
                              type="button" 
                              className="add-tag-toggle"
                              onClick={() => setActiveTagDropdown(activeTagDropdown === q.id ? null : q.id)}
                            >
                              <Tag size={12} />
                              Tag
                            </button>
                            
                            {activeTagDropdown === q.id && (
                              <div className="tag-dropdown-menu">
                                <div className="tag-options">
                                  {tags.filter(t => !(q.tagIds || []).includes(t.id)).map(t => (
                                    <button 
                                      key={t.id} 
                                      type="button" 
                                      className="tag-option-btn"
                                      onClick={() => handleAddTagToQuestion(q.id, t.id)}
                                    >
                                      <span className="tag-dot" style={{ backgroundColor: t.color }}></span>
                                      {t.label}
                                    </button>
                                  ))}
                                  {tags.filter(t => !(q.tagIds || []).includes(t.id)).length === 0 && (
                                    <p className="no-tags-msg">Todas as tags adicionadas.</p>
                                  )}
                                </div>
                                <div className="tag-divider"></div>
                                <form onSubmit={(e) => handleCreateAndAddTag(e, q.id)} className="create-tag-form">
                                  <input 
                                    type="text" 
                                    placeholder="Nova tag..." 
                                    value={newTagLabel}
                                    onChange={(e) => setNewTagLabel(e.target.value)}
                                    className="new-tag-input"
                                  />
                                  <button type="submit" className="new-tag-btn">Criar</button>
                                </form>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Primeira Linha Inputs */}
                        <div className="input-row highlight-row">
                          <div className="input-group fluid">
                            <label>Amostragem</label>
                            <input 
                              type="text" 
                              placeholder="Ex: 5 clientes"
                              value={ans.amostragem}
                              onChange={e => handleAnswerChange(q.id, 'amostragem', e.target.value)}
                              className="standard-input"
                            />
                          </div>
                          <div className="input-group fixed">
                            <label>Avaliado</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={ans.avaliado}
                              onChange={e => handleAnswerChange(q.id, 'avaliado', e.target.value)}
                              className="standard-input"
                            />
                          </div>
                          <div className="input-group fixed">
                            <label>Conforme</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={ans.conforme}
                              onChange={e => handleAnswerChange(q.id, 'conforme', e.target.value)}
                              className="standard-input"
                            />
                          </div>
                        </div>

                        {/* Segunda Linha Inputs */}
                        <div className="input-row split-row">
                          <div className="input-group">
                            <label>Observações</label>
                            <textarea 
                              placeholder="Detalhes sobre a conformidade..."
                              value={ans.observacoes}
                              onChange={e => handleAnswerChange(q.id, 'observacoes', e.target.value)}
                              rows={2}
                              className="standard-input area-input"
                            />
                          </div>
                          <div className="input-group">
                            <label>URL de Evidência</label>
                            <div className="link-wrapper">
                              <LinkIcon size={14} className="link-icon" />
                              <input 
                                type="url" 
                                placeholder="https://..."
                                value={ans.url}
                                onChange={e => handleAnswerChange(q.id, 'url', e.target.value)}
                                className="standard-input with-icon"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </section>
        </div>


        {/* =========================================
            PAINEL LATERAL DIREITA (Sidebar Panel)
            ========================================= */}
        <div className="side-panel-wrapper">
          <div className="card quick-audit-panel">
            
            <div className="panel-header">
              <div className="panel-title-wrapper">
                <FileText size={20} color="var(--laranja-vorp)" />
                <h3 className="bebas-font">AUDITORIA RÁPIDA</h3>
              </div>
              <span className="badge-new">NOVO</span>
            </div>

            <div className="panel-body">
              <div className="input-group">
                <label>Consultor</label>
                <div className="input-wrapper">
                  <select 
                    value={quickConsultant}
                    onChange={e => setQuickConsultant(e.target.value)}
                    className="select-input small-select"
                  >
                    <option value="" disabled>Selecionar...</option>
                    {consultants.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="select-icon" />
                </div>
              </div>

              <div className="input-group">
                <label>Categoria</label>
                <div className="input-wrapper">
                  <select 
                    value={quickCategory}
                    onChange={e => setQuickCategory(e.target.value)}
                    className="select-input small-select"
                  >
                    <option value="" disabled>Selecionar...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="select-icon" />
                </div>
              </div>

              <div className="split-row mt-compact">
                <div className="input-group">
                  <label>Avaliado</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={quickAvaliado}
                    onChange={e => setQuickAvaliado(e.target.value)}
                    className="standard-input highlight-val"
                  />
                </div>
                <div className="input-group">
                  <label>Conforme</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={quickConforme}
                    onChange={e => setQuickConforme(e.target.value)}
                    className="standard-input highlight-val"
                  />
                </div>
              </div>

              <div className="panel-footer">
                <button onClick={handleQuickSave} className="btn-primary w-full">
                  Salvar Avaliação
                </button>
              </div>

            </div>
            
            <div className="panel-disclaimer">
              <p>Todas as submissões geram logs atestando a qualidade do consultor.</p>
            </div>

          </div>
        </div>

      </div>

      {/* STYLES PADRONIZADOS */}
      <style jsx>{`
        .auditoria-page { 
          animation: fadeIn 0.5s ease-out; 
        }

        /* Tipografia de Cabeçalho igual do AdminManagement */
        .page-header { margin-bottom: 30px; }
        .page-header h2 { font-family: var(--font-bebas); font-size: 2rem; color: var(--text-main); margin-bottom: 8px; }
        .page-header p { color: var(--text-muted); font-size: 0.9rem; }

        .auditoria-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 30px;
          align-items: start;
        }

        .main-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .input-wrapper {
          position: relative;
        }

        .select-input {
          width: 100%;
          background: rgba(255,255,255,0.03); 
          border: 1px solid var(--card-border); 
          border-radius: 8px; 
          padding: 14px 16px; 
          color: var(--text-main);
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s;
          appearance: none;
          cursor: pointer;
        }

        .select-input:focus { border-color: var(--laranja-vorp); outline: none; background: rgba(255,255,255,0.05); }
        .select-input option { background-color: var(--preto-vorp); color: var(--text-main); }
        
        .small-select { padding: 12px 14px; font-size: 0.85rem; }

        .select-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        /* CHIPS TABS */
        .chips-container { display: flex; flex-wrap: wrap; items-center; gap: 12px; margin-bottom: 4px; }
        .chip {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 12px; border-radius: 100px;
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s;
        }
        .chip-active {
          border: 1px solid var(--laranja-vorp);
          color: var(--laranja-vorp);
          background: rgba(252, 84, 0, 0.05);
        }
        .chip-inactive {
          border: 1px solid rgba(252, 84, 0, 0.3);
          color: rgba(252, 84, 0, 0.7);
          background: transparent;
        }
        .chip-inactive:hover {
          border-color: rgba(252, 84, 0, 0.6);
          color: var(--laranja-vorp);
        }
        .chip-remove { opacity: 0.5; transition: opacity 0.2s; background: transparent; border: none; color: inherit; cursor: pointer; display: flex; align-items: center;}
        .chip-remove:hover { opacity: 1; }

        .chip-form { display: flex; align-items: center; gap: 8px; }
        .chip-input {
          background: transparent; border: 1px solid var(--card-border);
          border-radius: 100px; padding: 6px 14px; width: 130px;
          color: var(--text-main); font-size: 0.7rem; text-transform: uppercase;
          transition: all 0.2s;
        }
        .chip-input:focus { border-color: var(--laranja-vorp); outline: none; }
        .chip-add-btn {
          background: rgba(252, 84, 0, 0.1); border: 1px solid rgba(252, 84, 0, 0.3);
          color: var(--laranja-vorp); width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .chip-add-btn:hover { background: rgba(252, 84, 0, 0.2); }

        .tabs-nav { display: flex; gap: 32px; border-bottom: 1px solid var(--card-border); padding-top: 8px; }
        .tab-btn {
          padding-bottom: 12px; font-size: 0.75rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          border: none; border-bottom: 3px solid transparent;
          background: transparent; color: var(--text-muted);
          cursor: pointer; transition: all 0.2s;
        }
        .tab-btn:hover { color: var(--text-secondary); }
        .tab-btn.active { color: var(--laranja-vorp); border-bottom-color: var(--laranja-vorp); }

        .category-content { display: flex; flex-direction: column; gap: 24px; padding-top: 12px; }

        .add-question-bar {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--card-border);
          border-radius: 12px; padding: 16px 20px; transition: border-color 0.2s;
        }
        .add-question-bar:focus-within { border-color: var(--laranja-vorp); }
        .question-input { flex: 1; background: transparent; border: none; color: var(--text-main); font-size: 0.9rem; font-weight: 500; }
        .question-input::placeholder { color: var(--text-muted); }
        .question-input:focus { outline: none; }
        .add-question-action { background: transparent; border: none; color: var(--laranja-vorp); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; cursor: pointer; opacity: 0.8; transition: opacity 0.2s;}
        .add-question-action:hover { opacity: 1; }

        .questions-list { display: flex; flex-direction: column; gap: 20px; }
        .empty-message { color: var(--text-muted); font-size: 0.85rem; font-style: italic; }

        /* Questions Card */
        .question-card { padding: 28px; display: flex; flex-direction: column; gap: 24px; position: relative; }
        .question-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .question-title-group { display: flex; align-items: center; gap: 12px; }
        .question-icon { color: var(--laranja-vorp); }
        .question-header h3 { font-size: 1.6rem; color: var(--laranja-vorp); margin: 0; }
        .delete-question-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s;}
        .delete-question-btn:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        
        .question-tags-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: -12px; }
        .question-tag { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 100px; font-size: 0.65rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.05em; }
        .question-tag button { background: transparent; border: none; color: white; cursor: pointer; padding: 0; display: flex; opacity: 0.7; transition: opacity 0.2s; }
        .question-tag button:hover { opacity: 1; }
        
        .tag-dropdown-wrapper { position: relative; }
        .add-tag-toggle { display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.05); border: 1px dashed var(--card-border); color: var(--text-muted); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; cursor: pointer; transition: all 0.2s; }
        .add-tag-toggle:hover { color: var(--text-main); border-color: rgba(255,255,255,0.2); }
        
        .tag-dropdown-menu { position: absolute; top: 100%; left: 0; margin-top: 8px; width: 220px; background: var(--preto-vorp); border: 1px solid var(--card-border); border-radius: 12px; padding: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 10; display: flex; flex-direction: column; gap: 12px; }
        .tag-options { display: flex; flex-direction: column; gap: 4px; max-height: 150px; overflow-y: auto; }
        .tag-option-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: none; color: var(--text-main); font-size: 0.75rem; text-align: left; padding: 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .tag-option-btn:hover { background: rgba(255,255,255,0.05); }
        .tag-dot { width: 10px; height: 10px; border-radius: 50%; }
        .no-tags-msg { font-size: 0.7rem; color: var(--text-muted); text-align: center; padding: 8px 0; margin: 0; }
        .tag-divider { height: 1px; background: var(--card-border); }
        
        .create-tag-form { display: flex; gap: 6px; }
        .new-tag-input { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); border-radius: 6px; padding: 6px 10px; color: var(--text-main); font-size: 0.75rem; width: 100%; }
        .new-tag-input:focus { border-color: var(--laranja-vorp); outline: none; }
        .new-tag-btn { background: rgba(252, 84, 0, 0.1); border: 1px solid rgba(252, 84, 0, 0.2); color: var(--laranja-vorp); font-size: 0.7rem; font-weight: 700; padding: 0 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .new-tag-btn:hover { background: rgba(252, 84, 0, 0.2); }

        .input-row { display: flex; gap: 20px; }
        .highlight-row { display: grid; grid-template-columns: 1fr 120px 120px; gap: 20px; }
        .split-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .mt-compact { margin-top: 8px; }

        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 0.65rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; }
        
        .standard-input {
          background: rgba(255,255,255,0.03); 
          border: 1px solid var(--card-border); 
          border-radius: 8px; 
          padding: 12px 16px; 
          color: var(--text-main);
          font-size: 0.85rem;
          transition: all 0.2s;
          width: 100%;
        }
        .standard-input:focus { border-color: var(--laranja-vorp); outline: none; background: rgba(255,255,255,0.05); }
        .highlight-val { font-weight: 700; }
        
        .area-input { resize: none; min-height: 80px; }
        
        .link-wrapper { position: relative; }
        .link-icon { position: absolute; left: 16px; top: 14px; color: var(--text-muted); pointer-events: none;}
        .with-icon { padding-left: 40px; }

        /* Painel Lateral */
        .side-panel-wrapper { position: sticky; top: 32px; }
        .quick-audit-panel { padding: 28px; display: flex; flex-direction: column; gap: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
        
        .panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 20px; }
        .panel-title-wrapper { display: flex; align-items: center; gap: 10px; }
        .panel-header h3 { font-size: 1.4rem; color: var(--text-main); margin: 0; }
        .badge-new { background: rgba(252, 84, 0, 0.1); color: var(--laranja-vorp); font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 100px;}

        .panel-body { display: flex; flex-direction: column; gap: 20px; }
        .panel-footer { margin-top: 10px; }
        .w-full { width: 100%; justify-content: center; padding: 14px; }
        
        .panel-disclaimer p { font-size: 0.7rem; color: var(--text-muted); text-align: center; margin: 0; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 1100px) {
          .auditoria-grid { grid-template-columns: 1fr; }
          .highlight-row { grid-template-columns: 1fr; }
          .split-row { grid-template-columns: 1fr; }
          .side-panel-wrapper { position: relative; top: 0; }
        }
      `}</style>
    </div>
  );
}
