import React from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { 
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';

import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  
  const stats = [
    { 
      label: 'Ventas Hoy', 
      value: '€1,234', 
      icon: DollarSign, 
      color: 'green',
      change: '+12%'
    },
    { 
      label: 'Reservas Hoy', 
      value: '24', 
      icon: Calendar, 
      color: 'blue',
      change: '+5%'
    },
    { 
      label: 'Clientes Mes', 
      value: '486', 
      icon: Users, 
      color: 'purple',
      change: '+18%'
    },
    { 
      label: 'Platos Populares', 
      value: '8', 
      icon: TrendingUp, 
      color: 'orange',
      change: '+2%'
    },
  ];

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h2>Bienvenido, {user?.name}!</h2>
        <p>Aquí está el resumen de hoy para El Palleter</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <div className={`stat-icon stat-icon-${stat.color}`}>
                  <Icon size={24} />
                </div>
                <span className={`stat-change change-${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Actividad Reciente</h3>
            <Activity size={20} />
          </div>
          <div className="card-content">
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-time">Hace 5 min</span>
                <span className="activity-text">Nueva reserva para 4 personas</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">Hace 15 min</span>
                <span className="activity-text">Pedido #1234 completado</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">Hace 1 hora</span>
                <span className="activity-text">Actualización del menú del día</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Próximas Reservas</h3>
            <Calendar size={20} />
          </div>
          <div className="card-content">
            <div className="reservation-list">
              <div className="reservation-item">
                <div className="reservation-time">19:30</div>
                <div className="reservation-info">
                  <span className="reservation-name">María García</span>
                  <span className="reservation-details">Mesa para 2</span>
                </div>
              </div>
              <div className="reservation-item">
                <div className="reservation-time">20:00</div>
                <div className="reservation-info">
                  <span className="reservation-name">Juan Pérez</span>
                  <span className="reservation-details">Mesa para 6</span>
                </div>
              </div>
              <div className="reservation-item">
                <div className="reservation-time">21:30</div>
                <div className="reservation-info">
                  <span className="reservation-name">Ana Martínez</span>
                  <span className="reservation-details">Mesa para 4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;