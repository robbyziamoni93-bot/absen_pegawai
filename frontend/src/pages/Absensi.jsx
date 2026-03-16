import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPresensiHariIni, absenDatang, absenPulang, getRiwayatPresensi } from '../services/api';
import { ajukanCuti, getRiwayatCuti, gantiPassword } from '../services/api';
import './Absensi.css';

const Absensi = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [presensiHariIni, setPresensiHariIni] = useState(null);
  const [lokasi, setLokasi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCutiForm, setShowCutiForm] = useState(false);
  const [cutiData, setCutiData] = useState({ tgl_mulai: '', tgl_selesai: '', alasan: '' });
  const [riwayatCuti, setRiwayatCuti] = useState([]);
  const [activeTab, setActiveTab] = useState('absensi');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password_lama: '',
    password_baru: '',
    konfirmasi_password: ''
  });

  useEffect(() => {
    getLocation();
    fetchPresensiHariIni();
    fetchRiwayatCuti();
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLokasi({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchPresensiHariIni = async () => {
    try {
      const response = await getPresensiHariIni();
      setPresensiHariIni(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRiwayatCuti = async () => {
    try {
      const response = await getRiwayatCuti();
      setRiwayatCuti(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDatang = async () => {
    if (!lokasi) {
      alert('Lokasi GPS diperlukan untuk absen. Pastikan GPS aktif.');
      return;
    }

    setLoading(true);
    try {
      const lokasiGps = `${lokasi.latitude},${lokasi.longitude}`;
      await absenDatang(lokasiGps, 'Hadir');
      alert('Absen datang berhasil!');
      fetchPresensiHariIni();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal absen datang');
    } finally {
      setLoading(false);
    }
  };

  const handlePulang = async () => {
    if (!lokasi) {
      alert('Lokasi GPS diperlukan untuk absen. Pastikan GPS aktif.');
      return;
    }

    setLoading(true);
    try {
      const lokasiGps = `${lokasi.latitude},${lokasi.longitude}`;
      await absenPulang(lokasiGps);
      alert('Absen pulang berhasil!');
      fetchPresensiHariIni();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal absen pulang');
    } finally {
      setLoading(false);
    }
  };

  const handleCutiSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ajukanCuti(cutiData.tgl_mulai, cutiData.tgl_selesai, cutiData.alasan);
      alert('Pengajuan cuti berhasil dikirim!');
      setShowCutiForm(false);
      setCutiData({ tgl_mulai: '', tgl_selesai: '', alasan: '' });
      fetchRiwayatCuti();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal mengajukan cuti');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.password_lama || !passwordForm.password_baru || !passwordForm.konfirmasi_password) {
      alert('Semua field password harus diisi');
      return;
    }

    if (passwordForm.password_baru !== passwordForm.konfirmasi_password) {
      alert('Konfirmasi password tidak cocok');
      return;
    }

    if (passwordForm.password_baru.length < 6) {
      alert('Password baru minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await gantiPassword(passwordForm.password_lama, passwordForm.password_baru, passwordForm.konfirmasi_password);
      alert('Password berhasil diubah');
      setShowPasswordModal(false);
      setPasswordForm({ password_lama: '', password_baru: '', konfirmasi_password: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Yakin ingin logout?')) {
      logout();
      navigate('/');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="absensi-container">
      <div className="absensi-header">
        <div className="header-content">
          <h1>📋 Absensi Pegawai</h1>
          <div className="user-info">
            <span className="user-name">{user?.nama_lengkap}</span>
            <span className="user-nip">{user?.nip}</span>
            <button onClick={() => setShowPasswordModal(true)} className="btn-password">
              🔒 Ganti Password
            </button>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'absensi' ? 'active' : ''}`}
          onClick={() => setActiveTab('absensi')}
        >
          Absensi
        </button>
        <button 
          className={`tab ${activeTab === 'cuti' ? 'active' : ''}`}
          onClick={() => setActiveTab('cuti')}
        >
          Pengajuan Cuti
        </button>
      </div>

      <div className="absensi-content">
        {activeTab === 'absensi' && (
          <>
            <div className="status-card">
              <h2>Absensi Hari Ini</h2>
              {presensiHariIni ? (
                <div className="presensi-info">
                  <div className="status-item">
                    <span className="label">Jam Datang:</span>
                    <span className="value">{presensiHariIni.jam_datang}</span>
                  </div>
                  {presensiHariIni.jam_pulang && (
                    <div className="status-item">
                      <span className="label">Jam Pulang:</span>
                      <span className="value">{presensiHariIni.jam_pulang}</span>
                    </div>
                  )}
                  <div className="status-item">
                    <span className="label">Keterangan:</span>
                    <span className={`value ${presensiHariIni.keterangan}`}>{presensiHariIni.keterangan}</span>
                  </div>
                  <div className="status-item">
                    <span className="label">Status:</span>
                    <span className={`value ${presensiHariIni.status_kehadiran}`}>{presensiHariIni.status_kehadiran}</span>
                  </div>
                </div>
              ) : (
                <p className="belum-absen">Belum melakukan absensi hari ini</p>
              )}
            </div>

            <div className="action-cards">
              <div className="action-card">
                <h3>Absen Datang</h3>
                <p>{lokasi ? '✅ Lokasi GPS terdeteksi' : '⚠️ Aktifkan GPS untuk absen'}</p>
                <button 
                  onClick={handleDatang} 
                  disabled={loading || presensiHariIni?.jam_datang}
                  className="btn-action btn-datang"
                >
                  {presensiHariIni?.jam_datang ? 'Sudah Absen Datang' : 'Absen Datang'}
                </button>
              </div>

              <div className="action-card">
                <h3>Absen Pulang</h3>
                <p>{lokasi ? '✅ Lokasi GPS terdeteksi' : '⚠️ Aktifkan GPS untuk absen'}</p>
                <button 
                  onClick={handlePulang} 
                  disabled={loading || !presensiHariIni?.jam_datang || presensiHariIni?.jam_pulang}
                  className="btn-action btn-pulang"
                >
                  {presensiHariIni?.jam_pulang ? 'Sudah Absen Pulang' : !presensiHariIni?.jam_datang ? 'Absen Datang Dulu' : 'Absen Pulang'}
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'cuti' && (
          <>
            <div className="cuti-section">
              <button 
                className="btn-toggle-cuti"
                onClick={() => setShowCutiForm(!showCutiForm)}
              >
                {showCutiForm ? 'Batal Ajukan Cuti' : '+ Ajukan Cuti Baru'}
              </button>

              {showCutiForm && (
                <form onSubmit={handleCutiSubmit} className="cuti-form">
                  <div className="form-group">
                    <label>Tanggal Mulai</label>
                    <input
                      type="date"
                      value={cutiData.tgl_mulai}
                      onChange={(e) => setCutiData({...cutiData, tgl_mulai: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tanggal Selesai</label>
                    <input
                      type="date"
                      value={cutiData.tgl_selesai}
                      onChange={(e) => setCutiData({...cutiData, tgl_selesai: e.target.value})}
                      required
                      min={cutiData.tgl_mulai}
                    />
                  </div>
                  <div className="form-group">
                    <label>Alasan</label>
                    <textarea
                      value={cutiData.alasan}
                      onChange={(e) => setCutiData({...cutiData, alasan: e.target.value})}
                      required
                      rows="4"
                    />
                  </div>
                  <button type="submit" className="btn-submit-cuti" disabled={loading}>
                    {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
                  </button>
                </form>
              )}

              <h3>Riwayat Pengajuan Cuti</h3>
              {riwayatCuti.length > 0 ? (
                <table className="cuti-table">
                  <thead>
                    <tr>
                      <th>Tanggal Mulai</th>
                      <th>Tanggal Selesai</th>
                      <th>Alasan</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatCuti.map((cuti) => (
                      <tr key={cuti.id_cuti}>
                        <td>{formatDate(cuti.tgl_mulai)}</td>
                        <td>{formatDate(cuti.tgl_selesai)}</td>
                        <td>{cuti.alasan}</td>
                        <td>
                          <span className={`status-badge ${cuti.status_pengajuan.toLowerCase()}`}>
                            {cuti.status_pengajuan}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">Belum ada pengajuan cuti</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Ganti Password */}
      {showPasswordModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-content" style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', borderBottom: '1px solid #e0e0e0' }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '18px' }}>🔒 Ganti Password</h2>
              <button className="btn-close" onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', color: '#999', cursor: 'pointer', padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <form onSubmit={handleSubmitPassword} style={{ padding: '25px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Password Lama *</label>
                <input
                  type="password"
                  name="password_lama"
                  value={passwordForm.password_lama}
                  onChange={handlePasswordChange}
                  placeholder="Masukkan password lama"
                  required
                  style={{ width: '100%', padding: '10px 15px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Password Baru *</label>
                <input
                  type="password"
                  name="password_baru"
                  value={passwordForm.password_baru}
                  onChange={handlePasswordChange}
                  placeholder="Minimal 6 karakter"
                  required
                  style={{ width: '100%', padding: '10px 15px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  name="konfirmasi_password"
                  value={passwordForm.konfirmasi_password}
                  onChange={handlePasswordChange}
                  placeholder="Ulangi password baru"
                  required
                  style={{ width: '100%', padding: '10px 15px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)} style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', border: 'none', background: '#f0f0f0', color: '#666' }}>Batal</button>
                <button type="submit" className="btn-save" disabled={loading} style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', border: 'none', background: '#1e3a8a', color: 'white' }}>
                  {loading ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Absensi;
