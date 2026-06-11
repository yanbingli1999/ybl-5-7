import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Star, Trash2, Download, Clock, X, AlertTriangle, TrendingUp, Filter } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import api from '../services/api';
import type { ExperimentConfig, ExperimentResult, ExperimentRatings, BusinessTag } from '@shared/types';
import { BUSINESS_TAGS } from '@shared/types';

const RATING_ITEMS: { key: keyof ExperimentRatings; label: string }[] = [
  { key: 'stability', label: '稳定性' },
  { key: 'heatingSpeed', label: '升温速度' },
  { key: 'heatZoneConcentration', label: '热区集中度' },
];

function RatingStars({ value, onChange, readonly = false }: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`text-lg transition-colors ${
            readonly ? 'cursor-default' : 'cursor-pointer'
          } ${
            star <= (hover || value)
              ? 'text-yellow-400'
              : 'text-slate-600'
          }`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function CollectModal({ config, onSubmit, onClose }: {
  config: ExperimentConfig;
  onSubmit: (data: { ratings: ExperimentRatings; tags: BusinessTag[] }) => void;
  onClose: () => void;
}) {
  const [ratings, setRatings] = useState<ExperimentRatings>({
    stability: 3,
    heatingSpeed: 3,
    heatZoneConcentration: 3,
  });
  const [selectedTags, setSelectedTags] = useState<BusinessTag[]>([]);

  const toggleTag = (tag: BusinessTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-2xl border border-slate-600 shadow-2xl w-[400px] max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <h3 className="text-lg font-bold text-white">收藏实验</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm text-slate-300 font-medium">实验名称</p>
            <p className="text-sm text-slate-400 mt-1">{config.name}</p>
          </div>

          <div>
            <p className="text-sm text-slate-300 font-medium mb-3">评分</p>
            <div className="space-y-3">
              {RATING_ITEMS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 w-20">{label}</span>
                  <RatingStars
                    value={ratings[key]}
                    onChange={v => setRatings(prev => ({ ...prev, [key]: v }))}
                  />
                  <span className="text-xs text-yellow-400 w-6 text-right">{ratings[key]}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-300 font-medium mb-3">业务标签（至少选一个）</p>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => selectedTags.length > 0 && onSubmit({ ratings, tags: selectedTags })}
            disabled={selectedTags.length === 0}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTags.length > 0
                ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            确认收藏
          </button>
        </div>
      </div>
    </div>
  );
}

function RecommendationBadge({ index }: { index: number }) {
  let color: string;
  let label: string;
  if (index >= 4) {
    color = 'text-green-400 bg-green-900/30 border-green-700/50';
    label = '推荐';
  } else if (index >= 2.5) {
    color = 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
    label = '一般';
  } else {
    color = 'text-red-400 bg-red-900/30 border-red-700/50';
    label = '待改进';
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${color}`}>
      <TrendingUp className="w-3 h-3 inline mr-1" />
      {index} {label}
    </span>
  );
}

export const ExperimentPanel: React.FC = () => {
  const {
    experiments,
    favorites,
    setExperiments,
    setFavorites,
    setGrid,
    setBoundaryConditions,
    setMaterialId,
    setInitialHeatSources,
    setTotalSteps,
    setCurrentExperimentId,
    reset,
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'experiments' | 'favorites'>('experiments');
  const [modalConfig, setModalConfig] = useState<ExperimentConfig | null>(null);
  const [filterTag, setFilterTag] = useState<string>('');
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [filterSortBy, setFilterSortBy] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  const loadFilteredFavorites = useCallback(async () => {
    try {
      const data = await api.favorites.getAll({
        tag: filterTag || undefined,
        minRating: filterMinRating || undefined,
        sortBy: (filterSortBy as any) || undefined,
      });
      setFavorites(data);
    } catch (error) {
      console.error('加载收藏失败:', error);
    }
  }, [filterTag, filterMinRating, filterSortBy, setFavorites]);

  useEffect(() => {
    if (activeTab === 'favorites') {
      loadFilteredFavorites();
    }
  }, [activeTab, filterTag, filterMinRating, filterSortBy, loadFilteredFavorites]);

  const loadExperiment = (config: ExperimentConfig) => {
    reset();
    setGrid(config.grid);
    setBoundaryConditions(config.boundaryConditions);
    setMaterialId(config.materialId);
    setInitialHeatSources(config.initialHeatSources);
    setTotalSteps(config.totalSteps);
    setCurrentExperimentId(config.id);
  };

  const deleteExperiment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.experiments.delete(id);
      setExperiments(experiments.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('删除实验失败:', error);
    }
  };

  const deleteFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.favorites.delete(id);
      setFavorites(favorites.filter(fav => fav.id !== id));
    } catch (error) {
      console.error('删除收藏失败:', error);
    }
  };

  const handleCollectSubmit = async (config: ExperimentConfig, data: { ratings: ExperimentRatings; tags: BusinessTag[] }) => {
    const result: ExperimentResult = {
      id: `fav_${Date.now()}`,
      config,
      snapshots: [],
      isFavorite: true,
      completedAt: Date.now(),
      ratings: data.ratings,
      tags: data.tags,
      recommendationIndex: 0,
      improvementSuggestions: [],
    };
    try {
      const created = await api.favorites.create(result);
      setFavorites([...favorites, created]);
    } catch (error) {
      console.error('添加收藏失败:', error);
    }
    setModalConfig(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allTags = Array.from(new Set(favorites.flatMap(f => f.tags || [])));

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700 h-full flex flex-col">
      {modalConfig && (
        <CollectModal
          config={modalConfig}
          onSubmit={data => handleCollectSubmit(modalConfig, data)}
          onClose={() => setModalConfig(null)}
        />
      )}

      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          实验管理
        </h2>
        <div className="flex gap-1 mt-3 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('experiments')}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === 'experiments'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            实验记录 ({experiments.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            收藏 ({favorites.length})
          </button>
        </div>
      </div>

      {activeTab === 'favorites' && favorites.length > 0 && (
        <div className="border-b border-slate-700">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="w-full px-4 py-2 flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            筛选与排序
            {(filterTag || filterMinRating > 0 || filterSortBy) && (
              <span className="ml-auto w-2 h-2 bg-blue-400 rounded-full" />
            )}
          </button>
          {showFilter && (
            <div className="px-4 pb-3 space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1.5">按标签</p>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setFilterTag('')}
                    className={`text-xs px-2 py-0.5 rounded border transition-all ${
                      filterTag === ''
                        ? 'bg-slate-600 border-slate-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    全部
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                      className={`text-xs px-2 py-0.5 rounded border transition-all ${
                        filterTag === tag
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">最低推荐指数: {filterMinRating > 0 ? filterMinRating : '不限'}</p>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filterMinRating}
                  onChange={e => setFilterMinRating(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">排序方式</p>
                <select
                  value={filterSortBy}
                  onChange={e => setFilterSortBy(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="">按时间</option>
                  <option value="recommendationIndex">按推荐指数</option>
                  <option value="stability">按稳定性</option>
                  <option value="heatingSpeed">按升温速度</option>
                  <option value="heatZoneConcentration">按热区集中度</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'experiments' && (
          <>
            {experiments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无保存的实验</p>
                <p className="text-xs mt-1">点击下方"保存实验"按钮</p>
              </div>
            ) : (
              experiments.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group"
                  onClick={() => loadExperiment(exp)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-200 truncate">
                        {exp.name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(exp.createdAt)}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalConfig(exp);
                        }}
                        className="p-1.5 hover:bg-yellow-500/20 rounded-lg text-yellow-400"
                        title="添加收藏"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => deleteExperiment(exp.id, e)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                      {exp.grid.width}×{exp.grid.height}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                      {exp.totalSteps} 步
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded">
                      {exp.materialId}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-center">
                    <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                      <Download className="w-3 h-3" />
                      加载此实验
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            {favorites.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无收藏</p>
                <p className="text-xs mt-1">点击实验记录的星标收藏</p>
              </div>
            ) : (
              favorites.map((fav) => {
                const hasLowScore = fav.ratings && (
                  fav.ratings.stability <= 3 ||
                  fav.ratings.heatingSpeed <= 3 ||
                  fav.ratings.heatZoneConcentration <= 3
                );
                const isExpanded = expandedSuggestion === fav.id;

                return (
                  <div
                    key={fav.id}
                    className={`bg-slate-800/50 rounded-xl p-3 border transition-all cursor-pointer group ${
                      hasLowScore
                        ? 'border-orange-500/30 hover:border-orange-500/60'
                        : 'border-yellow-500/30 hover:border-yellow-500/60'
                    }`}
                    onClick={() => loadExperiment(fav.config)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <h4 className="text-sm font-medium text-slate-200 truncate">
                            {fav.config.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(fav.completedAt)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteFavorite(fav.id, e)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                        title="删除收藏"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {fav.ratings && (
                      <div className="mt-2 space-y-1">
                        {RATING_ITEMS.map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-16">{label}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <span
                                  key={s}
                                  className={`text-xs ${s <= fav.ratings[key] ? 'text-yellow-400' : 'text-slate-700'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {fav.recommendationIndex !== undefined && (
                      <div className="mt-2">
                        <RecommendationBadge index={fav.recommendationIndex} />
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                        {fav.config.grid.width}×{fav.config.grid.height}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-400 rounded">
                        {fav.snapshots.length} 快照
                      </span>
                      {fav.tags && fav.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {fav.improvementSuggestions && fav.improvementSuggestions.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSuggestion(isExpanded ? null : fav.id);
                          }}
                          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {isExpanded ? '收起建议' : `查看改进建议 (${fav.improvementSuggestions.length})`}
                        </button>
                        {isExpanded && (
                          <div className="mt-1.5 space-y-1">
                            {fav.improvementSuggestions.map((s, i) => (
                              <p key={i} className="text-xs text-orange-300/80 bg-orange-900/20 px-2 py-1 rounded border border-orange-800/30">
                                {s}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-center">
                      <button className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300">
                        <Download className="w-3 h-3" />
                        加载此实验
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExperimentPanel;
